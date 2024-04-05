import { ResultCode, checkPesel } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_INVALID_PESEL } from '$env/static/public';
import { tryRegister } from '$lib/server/user';

export const actions: Actions = {
    default: async (event) => {

        const formData:FormData = await event.request.formData();
		const pesel = formData.get("pesel")?.toString();
        if(!checkPesel(pesel) || !pesel) {
            return fail(ResultCode.BAD_REQUEST, { 
                issues: [{path: ["pesel"], message: PUBLIC_INVALID_PESEL}] 
            });
        }
        const result = await tryRegister(pesel);
        const cookieOptions = {
            httpOnly: false,
            path: '/',
            secure: false,
            maxAge: 5
        };

        event.cookies.set("message", result.message, cookieOptions);
        event.cookies.set("pesel", pesel, cookieOptions);
        if(result.success) {
            redirect(301, "/login");
        } else {
            redirect(301, "/register");
        }
    }
}