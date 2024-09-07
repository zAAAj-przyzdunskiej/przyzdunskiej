import { PUBLIC_NO_DECLARATION, PUBLIC_UNAUTHORIZED } from '$env/static/public';
import { getVisits } from '$lib/server/user.js';
import { json } from '@sveltejs/kit';

export async function GET({ locals, url}) {
    const user = locals.user;
    if (!user) {
        return json({success: false, httpCode: 401, message: PUBLIC_UNAUTHORIZED});
    }
    //let myDrUser = null
    if(!user.id) {
        return json({success: false, httpCode: 401, message: PUBLIC_NO_DECLARATION });
    }
    const page = url.searchParams.get("page");
    const page_size = url.searchParams.get("page_size");
    return json(await getVisits(user, page, page_size));
}