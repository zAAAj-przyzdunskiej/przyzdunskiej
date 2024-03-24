import { PUBLIC_MISSING_PESEL } from '$env/static/public';
import { resetPassword } from '$lib/server/user.js';
import { ResultCode } from '$lib/utils.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals, cookies }) {
    const body = await request.json();
    if(!body.pesel) {
        return json({success: false, httpCode: ResultCode.BAD_REQUEST, message: PUBLIC_MISSING_PESEL});
    }
    return json(await resetPassword(body.pesel));
}