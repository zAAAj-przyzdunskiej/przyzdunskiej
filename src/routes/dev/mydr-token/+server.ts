import { dev } from '$app/environment';
import { departments } from '$lib/server/mydrAuth';
import { MyDr } from '$lib/server/mydr';
import { error, json } from '@sveltejs/kit';

/**
 * Diagnostic endpoint for MyDr login — DEV MODE ONLY.
 * Forces a token to be acquired for every MyDr instance and reports the state without
 * leaking secrets. It never returns access_token or refresh_token, only whether they exist.
 */
type DepReport = {
    dep: string,
    label: string,
    has_access_token?: boolean,
    has_refresh_token?: boolean,
    expires_at?: string|null,
    person_id?: number|null,
    otp_device_id?: number|null,
    api_call_ok?: boolean,
    api_call_message?: string,
    error?: string
}

export async function GET() {
    if(!dev) {
        throw error(404, "Not found");
    }
    const report: DepReport[] = [];
    for(const dep of departments()) {
        try {
            const myDr = await MyDr.newInstance(null, dep);
            // The real test: listing patients requires full permissions and needs no department
            // id (which "_" is not). A token scoped two_factor_pending would get
            // 403 "Wymagane potwierdzenie 2FA" here.
            const getter = await myDr.newPatientGetter({page_size: 1});
            // Read the state AFTER the call — the token is acquired lazily, on first request.
            const stored = globalThis.myDrToken?.get(dep);
            report.push({
                dep: dep,
                label: dep === "_" ? "MyDr1 / POZ" : "MyDr2 / ginekologia",
                has_access_token: stored?.access_token != null,
                has_refresh_token: stored?.refresh_token != null,
                expires_at: stored?.expires_at ? new Date(stored.expires_at).toISOString() : null,
                person_id: stored?.person_id ?? null,
                otp_device_id: stored?.otp_device_id ?? null,
                api_call_ok: getter.ok,
                api_call_message: "HTTP " + getter.status
            });
        } catch(err) {
            report.push({
                dep: dep,
                label: dep === "_" ? "MyDr1 / POZ" : "MyDr2 / ginekologia",
                error: err instanceof Error ? err.message : String(err)
            });
        }
    }
    return json(report);
}
