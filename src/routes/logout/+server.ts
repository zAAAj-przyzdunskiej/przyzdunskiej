import { redirect } from '@sveltejs/kit';

export async function GET({ cookies, locals }) {
    cookies.delete("token", {path: '/'});
    cookies.delete("logged-in", {path: '/'});
    //locals.message = "you have logged out. Bye";
    throw redirect(303, "/");
}