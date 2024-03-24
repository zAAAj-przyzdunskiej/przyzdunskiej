import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from './$types';
import { genToken } from "$lib/server/user";
import { login } from "$lib/server/user";
import { userLoginSchema, type Result } from '$lib/utils';
import { JWT_EXPIRES_IN } from "$env/static/private";


export async function load({url, cookies, locals}) {
    const user = locals.user;
    if(cookies.get("token")) {
        // let token = await genToken(user.pesel);
        // const cookieOptions = {
        //     httpOnly: true,
        //     path: '/app',
        //     secure: (process.env.NODE_ENV !== 'development') ? true : false,
        //     maxAge: parseInt(JWT_EXPIRES_IN) * 60
        // };
        // cookies.set('token', token, cookieOptions);
        // cookies.set('logged-in', 'true', {
        //     ...cookieOptions,
        //     httpOnly: false
        // });
        // let redirectUrl = url.searchParams.get('redirectTo');
        // if (!redirectUrl) {
        //     redirectUrl = "/app/patient/";
        // }

        // console.log("redirecting to " + redirectUrl)
        // return {
        //     status: 302,
        //     redirect: redirectUrl
        // };
    } else {
        console.log("User not found on locals")
    }
}
export const actions: Actions = {
    default: async ({ request, url, cookies }) => {
        const formData = Object.fromEntries(await request.formData());
        const userInfo = userLoginSchema.safeParse(formData);
        if (!userInfo.success) {
            return fail(400, { issues: userInfo.error.issues });
        }
        
        const result: Result = await login(userInfo.data);
        if(!result.success) {
            console.log("User login: failed")
            return fail(result.httpCode, { issues: [{path: ["pesel", "password"], message: result.message}] });
        }
        //locals.user = result.user;
        const cookieMaxAge = parseInt(JWT_EXPIRES_IN) * 60;
        const user = result.user;
        if(user) {
            let token = await genToken(user.pesel);
            const cookieOptions = {
                httpOnly: true,
                path: '/',
                secure: false,
                maxAge: cookieMaxAge
            };
            cookies.set('token', token, cookieOptions);
            cookies.set('logged-in', 'true', {
                ...cookieOptions,
                httpOnly: false
            });
            let redirectUrl = url.searchParams.get('redirectTo');
            if (!redirectUrl) {
                redirectUrl = "/app/patient/";
            }
            throw redirect(303, redirectUrl);
        } 
        //console.log("logged in");
    }
};