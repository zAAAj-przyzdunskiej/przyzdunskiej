import { userRegisterSchema, type RegisterUserInput, register, tryRegister, type UserRegister } from '$lib/server/user';
import { fail } from "@sveltejs/kit";
import type { Actions } from './$types';
import { type User } from '@prisma/client';
import { checkPesel } from '$lib/utils';
import { PUBLIC_INVALID_PESEL } from '$env/static/public';

export async function load({locals, url}) {
    let message = locals.message;
    if(! message) {
		message = "Gdy tylko otrzymamy Twoje dane za pośrednictwem deklaracja wyboru, wyślemy Ci link umożliwiający aktywację konta \
		<br> Obsługujemy wyłącznie następujące obszary objęte kodami pocztowymi:"
	}
	// || {pesel: "", name: "", surname: "", email: "", telephone: "", zipcode: ""}
	return locals.regisUser ? {message: message, user: locals.regisUser} : {message : message};
}
export const actions: Actions = {
    registerOrFollowup: async ({ cookies, request, locals, url }) => {
		const formData:FormData = await request.formData();
        const reqData = Object.fromEntries(formData);
        const validResult = userRegisterSchema.safeParse(reqData);
        if (!validResult.success) {
            return fail(400, { issues: validResult.error.issues });
        }
		const userInfo = validResult.data;
		const result = await register(userInfo);
		if(!result.success) {
			let existingUser:User = result.user;
			// if(!existingUser && result.userPromise) {
			// 	existingUser = await result.userPromise;
			// }
			if(existingUser) {
				if(existingUser.active) fail(400, { issues: [{message: result.message}]});
				return fail(400, { issues: [{message: "Twoje konto już istnieje."}]});
			}
			return fail(400, { issues: [{message: result.message}]});
		}
		// if(result.activationToken) {
		// 	let urlStr = url.origin + "/password/" + result.activationToken
		// 	locals.message = `Aby ustawić hasło, kliknij link aktywacyjny w wiadomości e-mail. 
		// 		Link jest ważny tylko przez 60 minut. Jeśli wygasło, kliknij Resetuj hasło, aby uzyskać kolejny link`
		// 		+ urlStr;
			
		// }
		locals.message = result.message;
		locals.regisUser = result.user ? result.user : userInfo;
	},
	registerOnly: async ({ cookies, request, locals, url }) => {
		const formData:FormData = await request.formData();
		const pesel = formData.get("pesel")?.toString();
		if(pesel) {
			if(checkPesel(pesel)) {
				const result = await tryRegister(pesel);
				if(!result.success) {
					return fail(result.httpCode, {issues: [{message: result.message}]})
				}
				locals.message = result.message;
				locals.regisUser = result.user;
		} else {
				locals.regisUser = {pesel: pesel, name: "", surname: "", 
									email: "", telephone: "", zipcode: ""};
				return fail(400, { issues: [{message: PUBLIC_INVALID_PESEL}]});
			}
		}
	}
}