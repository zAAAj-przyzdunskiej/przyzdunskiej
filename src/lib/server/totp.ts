import { createHmac } from 'node:crypto';

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Decodes a base32 secret (RFC 4648) taken from the MyDr QR code.
 * Tolerates lower case, spaces, dashes and "=" padding.
 */
export function base32Decode(secret: string): Buffer {
    const cleaned = secret.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
    if(isEmptyStr(cleaned)) {
        throw new Error("TOTP secret is empty");
    }
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];
    for(const char of cleaned) {
        const idx = BASE32_ALPHABET.indexOf(char);
        if(idx < 0) {
            throw new Error("Invalid base32 character in TOTP secret: " + char);
        }
        value = (value << 5) | idx;
        bits += 5;
        if(bits >= 8) {
            bits -= 8;
            bytes.push((value >>> bits) & 0xff);
        }
    }
    return Buffer.from(bytes);
}

function isEmptyStr(str: string): boolean {
    return str.length == 0;
}

/**
 * Generates a TOTP code (RFC 6238) using the same parameters as django-otp in MyDr,
 * which are also the Google Authenticator defaults: HMAC-SHA1, 6 digits, 30-second window.
 *
 * @param base32Secret the `secret=` parameter from the otpauth:// URL (QR code)
 * @param atMs         the moment to compute the code for (defaults to now)
 */
export function totp(base32Secret: string, atMs: number = Date.now()): string {
    const key = base32Decode(base32Secret);
    const counter = Math.floor(atMs / 1000 / 30);

    const counterBuf = Buffer.alloc(8);
    // 8-byte big-endian counter; two writeUInt32BE calls avoid needing BigInt here
    counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuf.writeUInt32BE(counter >>> 0, 4);

    const hmac = createHmac('sha1', key).update(counterBuf).digest();

    // dynamic truncation (RFC 4226, section 5.3)
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binCode = ((hmac[offset] & 0x7f) << 24)
        | ((hmac[offset + 1] & 0xff) << 16)
        | ((hmac[offset + 2] & 0xff) << 8)
        | (hmac[offset + 3] & 0xff);

    return (binCode % 1000000).toString().padStart(6, "0");
}

/**
 * Milliseconds left in the current 30-second window.
 * Useful to avoid sending MyDr a code that expires mid-request.
 */
export function totpMsRemaining(atMs: number = Date.now()): number {
    return 30000 - (atMs % 30000);
}
