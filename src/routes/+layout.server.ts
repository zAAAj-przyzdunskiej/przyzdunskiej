export async function load({locals}) {
    if(locals.token) {
        return {hasToken: true};
    }
}