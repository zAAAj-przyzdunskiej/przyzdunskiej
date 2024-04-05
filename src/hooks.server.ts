import { error, redirect, type Handle, json } from '@sveltejs/kit';
import { getUserByPesel } from '$lib/server/user';
import { PUBLIC_NO_DECLARATION, PUBLIC_SERVER_ERROR, PUBLIC_SESSION_EXPIRED, PUBLIC_UA_NOTACTIVATED } from '$env/static/public';
import { verifyJWT } from '$lib/server/token';
import { ResultCode, type User } from '$lib/utils';

export const handle: Handle = async ({ resolve, event }) => {
    const { url, locals, request, cookies } = event;

    let authToken: string | undefined;
    if (cookies.get('token')) {
        authToken = cookies.get('token');
    } else if (request.headers.get('Authorization')?.startsWith('Bearer ')) {
        authToken = request.headers.get('Authorization')?.substring(7);
    }
    if(authToken) {
        locals.token = authToken;
    }

    const isAjax = url.searchParams.get("ajax");
    
    if(url.pathname.startsWith('/app')) {
        if (!authToken) {
            console.log("No token provided in cookies");
            if(isAjax) {
                return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_SESSION_EXPIRED})
            }

            //throw error(401, 'Nie jesteś zalogowany. Podaj token aby uzyskać dostęp.');
            throw redirect(303, "/login?redirectTo=" + url.pathname)
        }
        let pesel: string;
        try {
            const { sub } = await verifyJWT<{ sub: string }>(authToken);
            pesel = sub;
        } catch(error: any) {
            if(isAjax) {
                return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_SESSION_EXPIRED})
            }
            throw redirect(303, "/login?redirectTo=" + url.pathname)
        }

        let ua: User|null = null;
        try {
            ua = await getUserByPesel(pesel);
        } catch (err: any) {
            if(isAjax) {
                return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_SERVER_ERROR})
            }
            throw error(500, PUBLIC_SERVER_ERROR);
        }
        if(ua == null || !ua.id) {
            if(isAjax) {
                return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_NO_DECLARATION})
            }
            throw error(401, PUBLIC_NO_DECLARATION);
        } 
        if(!ua.active) {
            if(isAjax) {
                return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_UA_NOTACTIVATED})
            }
            throw error(401, PUBLIC_UA_NOTACTIVATED);
        } 
        
        locals.user = ua;
    }

    const response = await resolve(event);
    return response;
};
