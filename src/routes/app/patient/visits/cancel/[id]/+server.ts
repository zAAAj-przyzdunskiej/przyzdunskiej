import { MyDr } from '$lib/server/mydr.js';
import { ResultCode } from '$lib/utils.js';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
    const visitId = params.id;
    const myDr = await MyDr.newInstance();
    const visit = await myDr.getAppointmentByPk(visitId);
    if(visit === null) {
        return json({success: true, httpCode: 200, message: "Nie znaleziono wizyty"});
    }

    let visitDate;
    try {
        visitDate = Date.parse(visit.date + "T" + visit.timeFrom);
    } catch (error) {
        return json({success: false, httpCode: ResultCode.BAD_REQUEST, message: "Format daty i godziny jest nieprawidłowy"})
    }
    const today = new Date();
    if(today.getTime() >= visitDate) {
        return json({success: false, httpCode: ResultCode.BAD_REQUEST, message: "Nie ma możliwości anulowania poprzedniej wizyty"})
    }
    const result = await myDr.cancelAppointment(visit);
    return json(result);
}