import { env } from '$env/dynamic/private';
import { MYDR_URL, MYDR_CLIENT_ID, MYDR_CLIENT_SECRET, MYDR_USER, MYDR_PASSWORD } from '$env/static/private';
import { MYDR2_CLIENT_ID, MYDR2_CLIENT_SECRET, MYDR2_USER, MYDR2_PASSWORD } from '$env/static/private';
import { buildUrlQueryData } from '$lib/utils';
import { withTransaction } from '$lib/server/db';
import { totp, totpMsRemaining } from '$lib/server/totp';
import type { PoolClient } from 'pg';

/**
 * Login to MyDr EDM on accounts with mandatory 2FA.
 *
 * Per the MyDr docs (OAuth -> "Logowanie dwuetapowe (2FA)"):
 *  1. grant_type=password on a 2FA account returns a restricted token:
 *     scope="two_factor_pending", requires_2fa=true, NO refresh_token.
 *     Such a token returns 403 "Wymagane potwierdzenie 2FA" on every other endpoint.
 *  2. GET /login-device/ with that token -> otp_devices[].id
 *  3. POST /setup-mobile-otp-device/{id}/verify_2fa_code/ with a TOTP code ->
 *     THE SAME access_token is elevated to scope="external_api" and gains a refresh_token.
 *  4. From then on grant_type=refresh_token works with NO further 2FA (confirmation is one-off).
 *
 * Two facts drive the shape of this module:
 *  - an access_token lives for 10 hours,
 *  - the refresh_token ROTATES on every refresh and the previous one dies immediately.
 *    Hence tokens live in Postgres and are refreshed under a row lock (SELECT ... FOR UPDATE):
 *    without it, concurrent serverless instances would invalidate each other's access.
 */

const TOKEN_URL = MYDR_URL + "/o/token/";
const LOGIN_DEVICE_URL = MYDR_URL + "/login-device/";
const VERIFY_OTP_URL = (deviceId: number) => MYDR_URL + "/setup-mobile-otp-device/" + deviceId + "/verify_2fa_code/";

/** Margin for treating a token as expired, so we never use one that expires mid-request. */
const EXPIRY_MARGIN_MS = 60 * 1000;

type DepCredentials = {
    username: string,
    password: string,
    client_id: string,
    client_secret: string,
    /** Base32 secret from the QR code (the `secret=` parameter in otpauth://). */
    totpSecret?: string
}

const depCredentials: {[key:string]: DepCredentials} = {
    "_": {
        username: MYDR_USER,
        password: MYDR_PASSWORD,
        client_id: MYDR_CLIENT_ID,
        client_secret: MYDR_CLIENT_SECRET,
        totpSecret: env.MYDR_TOTP_SECRET
    },
    "51934": {
        //Gynecology:
        username: MYDR2_USER,
        password: MYDR2_PASSWORD,
        client_id: MYDR2_CLIENT_ID,
        client_secret: MYDR2_CLIENT_SECRET,
        totpSecret: env.MYDR2_TOTP_SECRET
    }
}

/** Whether credentials are configured for this department. */
export function hasCredentials(dep: string): boolean {
    return depCredentials[dep] != undefined;
}

/**
 * Keys of every configured MyDr instance ("_" = POZ, "51934" = gynecology).
 * The department list used to be read from globalThis.myDrToken.keys(); that map is now
 * filled lazily, so call order must not decide what the patient gets to see.
 */
export function departments(): string[] {
    return Object.keys(depCredentials);
}

export type RawToken = {
    access_token: string,
    token_type: string,
    expires_in: number,
    scope: string,
    requires_2fa?: boolean,
    refresh_token?: string
}

/** What we keep in the database and in the process memo. */
export type StoredToken = {
    access_token: string|null,
    refresh_token: string|null,
    /** access_token expiry as epoch milliseconds. */
    expires_at: number|null,
    person_id: number|null,
    otp_device_id: number|null
}

function isUsable(token: StoredToken|undefined|null, now: number = Date.now()): boolean {
    return token != null
        && token.access_token != null
        && token.expires_at != null
        && token.expires_at > now + EXPIRY_MARGIN_MS;
}

function memo(): Map<string, StoredToken> {
    if(!globalThis.myDrToken) {
        globalThis.myDrToken = new Map<string, StoredToken>();
    }
    return globalThis.myDrToken;
}

/**
 * Returns a valid access_token for the given MyDr department, refreshing it or
 * running a full login with 2FA confirmation when needed.
 */
export async function getAccessToken(dep: string): Promise<string> {
    const cached = memo().get(dep);
    if(isUsable(cached)) {
        return cached!.access_token!;
    }
    const token = await refreshUnderLock(dep);
    memo().set(dep, token);
    return token.access_token!;
}

/**
 * Drops the access_token from the memo and the database — called when MyDr answered 401/403,
 * i.e. the token was revoked earlier than expires_at suggested.
 * The refresh_token is kept: a plain refresh will most likely do, with no TOTP code spent.
 */
export async function invalidateAccessToken(dep: string): Promise<void> {
    memo().delete(dep);
    try {
        await withTransaction(async (client) => {
            await client.query(
                'UPDATE "MyDrToken" SET "access_token" = NULL, "expires_at" = NULL, "updatedAt" = now() WHERE "dep" = $1',
                [dep]
            );
        });
    } catch(err) {
        // The process memo is already cleared, so the next request will fetch a token anyway.
        console.error("MyDr[" + dep + "]: failed to clear stored access token", err);
    }
}

async function refreshUnderLock(dep: string): Promise<StoredToken> {
    const creds = depCredentials[dep];
    if(!creds) {
        throw new Error("MyDr: no credentials configured for department " + dep);
    }
    return withTransaction(async (client) => {
        const stored = await lockRow(client, dep);

        // Another instance may have refreshed the token while we waited for the lock.
        // This re-check also prevents spending the same TOTP code twice.
        if(isUsable(stored)) {
            console.log("MyDr[" + dep + "]: token refreshed by another instance, reusing");
            return stored;
        }

        if(stored.refresh_token) {
            try {
                const refreshed = await requestToken({
                    grant_type: "refresh_token",
                    refresh_token: stored.refresh_token,
                    client_id: creds.client_id,
                    client_secret: creds.client_secret
                });
                return await saveRow(client, dep, {
                    access_token: refreshed.access_token,
                    refresh_token: refreshed.refresh_token || null,
                    expires_at: expiryOf(refreshed),
                    person_id: stored.person_id,
                    otp_device_id: stored.otp_device_id
                });
            } catch(err) {
                // The refresh token expired or was revoked (400 invalid_grant) — log in from scratch.
                console.warn("MyDr[" + dep + "]: refresh failed, falling back to full login. " + errMsg(err));
            }
        }

        const fresh = await login(dep, creds, stored);
        return await saveRow(client, dep, fresh);
    });
}

async function lockRow(client: PoolClient, dep: string): Promise<StoredToken> {
    const res = await client.query(
        'SELECT "access_token", "refresh_token", "expires_at", "person_id", "otp_device_id"'
        + ' FROM "MyDrToken" WHERE "dep" = $1 FOR UPDATE',
        [dep]
    );
    if(res.rows.length == 0) {
        // The row is seeded in schema.sql, but create it if missing so there is something to lock.
        await client.query('INSERT INTO "MyDrToken"("dep") VALUES ($1) ON CONFLICT DO NOTHING', [dep]);
        return {access_token: null, refresh_token: null, expires_at: null, person_id: null, otp_device_id: null};
    }
    const row = res.rows[0];
    return {
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: row.expires_at ? new Date(row.expires_at).getTime() : null,
        person_id: row.person_id,
        otp_device_id: row.otp_device_id
    };
}

async function saveRow(client: PoolClient, dep: string, token: StoredToken): Promise<StoredToken> {
    const params: unknown[] = [
        dep,
        token.access_token,
        token.refresh_token,
        token.expires_at ? new Date(token.expires_at).toISOString() : null,
        token.person_id,
        token.otp_device_id
    ];
    await client.query(
        'UPDATE "MyDrToken" SET "access_token" = $2, "refresh_token" = $3, "expires_at" = $4,'
        + ' "person_id" = $5, "otp_device_id" = $6, "updatedAt" = now() WHERE "dep" = $1',
        params
    );
    console.log("MyDr[" + dep + "]: token stored, expires_at="
        + (token.expires_at ? new Date(token.expires_at).toISOString() : "null")
        + ", has_refresh_token=" + (token.refresh_token ? "true" : "false"));
    return token;
}

/**
 * Full login: grant_type=password, plus confirmation with an authenticator-app code (TOTP)
 * when the account requires 2FA. After that step the same access_token has full permissions.
 */
async function login(dep: string, creds: DepCredentials, stored: StoredToken): Promise<StoredToken> {
    const pending = await requestToken({
        grant_type: "password",
        username: creds.username,
        password: creds.password,
        client_id: creds.client_id,
        client_secret: creds.client_secret
    });
    const expires_at = expiryOf(pending);

    if(pending.requires_2fa !== true && pending.scope != "two_factor_pending") {
        // Account without enforced 2FA — the token already has full permissions.
        return {
            access_token: pending.access_token,
            refresh_token: pending.refresh_token || null,
            expires_at: expires_at,
            person_id: stored.person_id,
            otp_device_id: stored.otp_device_id
        };
    }

    console.log("MyDr[" + dep + "]: token requires 2FA confirmation, verifying OTP code");
    if(!creds.totpSecret) {
        throw new Error("MyDr[" + dep + "]: account requires 2FA but no TOTP secret is configured."
            + " Set " + (dep == "_" ? "MYDR_TOTP_SECRET" : "MYDR2_TOTP_SECRET")
            + " to the base32 secret from the MyDr QR code.");
    }

    let deviceId = stored.otp_device_id;
    let personId = stored.person_id;
    const usedCachedDevice = deviceId != null;
    if(!deviceId) {
        const device = await findOtpDevice(dep, pending.access_token);
        deviceId = device.deviceId;
        personId = device.personId;
    }

    // Generate the code once and keep it: if the device turns out to have changed, the same code
    // is still valid (MyDr tracks reuse per device), so we avoid waiting for the next 30s window.
    const code = await freshTotpCode(dep, creds.totpSecret);
    let confirmed;
    try {
        confirmed = await verifyOtpCode(dep, pending.access_token, deviceId, code);
    } catch(err) {
        if(!usedCachedDevice) {
            throw err;
        }
        // The stored device id may be stale — someone removed and re-added the OTP device
        // in the MyDr web panel. Re-read the current id and retry exactly once.
        console.warn("MyDr[" + dep + "]: verification with cached OTP device " + deviceId
            + " failed, re-reading device list. " + errMsg(err));
        const device = await findOtpDevice(dep, pending.access_token);
        if(device.deviceId === deviceId) {
            throw err;
        }
        personId = device.personId;
        deviceId = device.deviceId;
        confirmed = await verifyOtpCode(dep, pending.access_token, deviceId, code);
    }

    return {
        // MyDr elevates THE SAME token; access_token in the response is just a confirmation.
        access_token: confirmed.access_token || pending.access_token,
        refresh_token: confirmed.refresh_token || pending.refresh_token || null,
        // The verification response carries no expires_in — take the lifetime from the password grant.
        expires_at: expires_at,
        person_id: personId,
        otp_device_id: deviceId
    };
}

type OtpDeviceRef = {deviceId: number, personId: number|null};

/**
 * Reads the id of a confirmed OTP device. A token scoped two_factor_pending can only
 * reach this and a handful of related endpoints.
 */
async function findOtpDevice(dep: string, pendingToken: string): Promise<OtpDeviceRef> {
    const res = await fetch(LOGIN_DEVICE_URL, {
        method: "GET",
        headers: {'Authorization': "Bearer " + pendingToken, 'Accept': 'application/json'}
    });
    if(!res.ok) {
        throw new Error("MyDr[" + dep + "]: failed to list 2FA devices, HTTP " + res.status
            + ", message: " + (await res.text()));
    }
    const body = await res.json();
    // Without a parameter the endpoint returns an array with a single entry (the token owner).
    const entries = Array.isArray(body) ? body : [body];
    for(const entry of entries) {
        const devices = entry?.otp_devices;
        if(!Array.isArray(devices)) continue;
        for(const device of devices) {
            if(device?.confirmed === true && device?.id != null) {
                if(device.locked_until) {
                    throw new Error("MyDr[" + dep + "]: OTP device " + device.id
                        + " is locked until " + device.locked_until + " after too many failed attempts");
                }
                console.log("MyDr[" + dep + "]: using OTP device id=" + device.id);
                return {deviceId: device.id, personId: entry.id ?? null};
            }
        }
    }
    throw new Error("MyDr[" + dep + "]: no confirmed OTP (authenticator) device found on this account."
        + " Add one in the MyDr web panel and save its base32 secret.");
}

/**
 * Last TOTP code sent to MyDr, per secret. MyDr (django-otp) rejects reuse of the same
 * code — "Kod został już użyty" — so a second login inside the same 30-second window has
 * to wait for the next code. Keyed by secret rather than department, to also cover the
 * case of two accounts sharing one OTP device.
 */
const lastUsedCode = new Map<string, string>();

/** Never block a request for longer than a single TOTP window. */
const MAX_TOTP_WAIT_MS = 31000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns a TOTP code MyDr has not seen yet, waiting for the next 30-second window if needed.
 */
async function freshTotpCode(dep: string, totpSecret: string): Promise<string> {
    let code = totp(totpSecret);
    if(lastUsedCode.get(totpSecret) === code) {
        const waitMs = Math.min(totpMsRemaining() + 1000, MAX_TOTP_WAIT_MS);
        console.log("MyDr[" + dep + "]: TOTP code already used, waiting " + waitMs + "ms for the next one");
        await sleep(waitMs);
        code = totp(totpSecret);
    }
    lastUsedCode.set(totpSecret, code);
    return code;
}

/**
 * Confirms the token with a TOTP code. Deliberately NO retry with the same code on the same
 * device: MyDr locks the device (locked_until) and demands a captcha after a run of failures.
 */
async function verifyOtpCode(dep: string, pendingToken: string, deviceId: number, code: string): Promise<RawToken & {confirmed?: boolean}> {
    const res = await fetch(VERIFY_OTP_URL(deviceId), {
        method: "POST",
        headers: {
            'Authorization': "Bearer " + pendingToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({token: code})
    });
    const text = await res.text();
    if(!res.ok) {
        throw new Error("MyDr[" + dep + "]: 2FA code rejected, HTTP " + res.status + ", message: " + text);
    }
    const body = JSON.parse(text) as RawToken & {confirmed?: boolean, locked_until?: string};
    if(body.confirmed !== true || body.requires_2fa === true || body.scope == "two_factor_pending") {
        throw new Error("MyDr[" + dep + "]: 2FA confirmation did not elevate the token, response: " + text);
    }
    console.log("MyDr[" + dep + "]: 2FA confirmed, scope=" + body.scope);
    return body;
}

async function requestToken(reqBody: object): Promise<RawToken> {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Accept': 'application/json'
        },
        body: buildUrlQueryData(reqBody)
    });
    if(!res.ok) {
        throw new Error("MyDr token request failed, HTTP " + res.status + ", message: " + (await res.text()));
    }
    return (await res.json()) as RawToken;
}

/** expires_in is a number of seconds; convert it to an absolute timestamp. */
function expiryOf(token: RawToken): number {
    return Date.now() + token.expires_in * 1000;
}

function errMsg(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}
