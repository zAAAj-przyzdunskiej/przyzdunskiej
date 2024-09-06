import { PUBLIC_MISSING_DATE, PUBLIC_NO_DECLARATION, PUBLIC_SERVER_ERROR, PUBLIC_UA_NOTACTIVATED, PUBLIC_UNAUTHORIZED } from '$env/static/public';
import { MyDr } from '$lib/server/mydr.js';
import { ResultCode } from '$lib/utils.js';
import { json } from '@sveltejs/kit';

export async function GET({ locals, url }) {
    const visitDate = url.searchParams.get("visitDate"); 
    if(!visitDate) {
        return json({success: false, httpCode: ResultCode.BAD_REQUEST, message: PUBLIC_MISSING_DATE});
    }
    const office = url.searchParams.get("office"); //department
    const myDr = await MyDr.newInstance(office);
    const res = await myDr.getFreeSlots(visitDate, office);
    if(!res.success) {
        return json(res);
    }
    const slots = res.slots;
    for(const slot of slots) {
        delete slot.private_services_custom_indexes;
        for (const doctor of res.doctors) {
            if(doctor.id === slot.doctor) {
                slot.doctorName = doctor.first_name + " " + doctor.last_name;
                break;
            }
        }
    }
    return json({success: true, httpCode: ResultCode.OK, message: "OK", slots: slots});
}