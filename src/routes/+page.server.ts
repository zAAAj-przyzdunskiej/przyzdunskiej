export async function load({locals}) {
    if(locals.message) {
        return {message: locals.message};
    }
}