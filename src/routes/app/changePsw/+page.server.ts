import { PUBLIC_MISSING_PASSWORD, PUBLIC_NO_DECLARATION, PUBLIC_UNAUTHORIZED } from "$env/static/public";
import { ResultCode } from "$lib/utils";
import { z } from "zod";
import type { Actions } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { changePassword } from "$lib/server/user";

const pswChangeSchema = z.object({
    password: z.string({required_error: PUBLIC_MISSING_PASSWORD})
                .min(8, "Hasło powinno mieć minimum 8 znaków"),
    pswConfirm: z.string({required_error: "brak potwierdzenia hasła"})
}).refine((data) => data.password === data.pswConfirm, {
    path: ['pswConfirm'],
    message: 'Hasła się nie zgadzają'
});;
type PswChangeInput = z.infer<typeof pswChangeSchema>;

export async function load({url, cookies, locals}) {
    let msg = "";
    if(locals.message) {
        msg = msg + locals.message;
    }
    return {_msg: msg};
}

export const actions: Actions = {
    default: async ({ request, locals, url }) => {
        const user = locals.user;
        if (!user) {
            return fail(ResultCode.UNAUTHORIZED, {issues: [{message: PUBLIC_UNAUTHORIZED}]});
        }
		const formData:FormData = await request.formData();
        const reqForm = Object.fromEntries(formData);
        const pswInput = pswChangeSchema.safeParse(reqForm);
        if (!pswInput.success) {
            return fail(ResultCode.BAD_REQUEST, { issues: pswInput.error.issues });
        } else {
            changePassword(user.pesel, pswInput.data.password);
            locals.message = "Twoje hasło zostało zmienione";
        }
    }
 }