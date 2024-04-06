import { DEFAULT_VISIT_TYPE } from '$env/static/private';
import { PUBLIC_NO_DECLARATION, PUBLIC_UA_DEACTIVATED, PUBLIC_UNAUTHORIZED } from '$env/static/public';
import { MyDr, VisitKind, type Visit } from '$lib/server/mydr.js';
import { getDoctor, updateUser } from '$lib/server/user.js';
import { ResultCode } from '$lib/utils.js';
import { json, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const visitSchema: z.ZodType<Visit> = z.object({
    doctor: z.number({required_error: "Lekarz nie został wybrany"}),
    office: z.number({required_error: "Biuro nie zostało wybrane"}),
    date: z.string({required_error: "Biuro nie zostało wybrane"}),
    timeFrom: z.string({required_error: "Godzina spotkania nie została wybrana"}),
    timeTo: z.string({required_error: "Godzina spotkania nie została wybrana"}),
    interview: z.string({required_error: "Proszę wypełnić wszystkie wymagane pola."}),
    visit_kind: z.nativeEnum(VisitKind).optional()
});
export async function POST({ request, locals, cookies }) {
    const user = locals.user;
    if (!user) {
        return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_UNAUTHORIZED});
    }
    //let myDrUser = null
    if(!user.id) {
        return json({success: false, httpCode: ResultCode.UNAUTHORIZED, message: PUBLIC_NO_DECLARATION });
    }
    const myDrPromise = MyDr.newInstance();

    const body = (await request.json());
	const validResult = visitSchema.safeParse(body);
    if (!validResult.success) {
        return json({success: false, httpCode: ResultCode.BAD_REQUEST, message:"Proszę wybrać slot", issues: validResult.error.issues });
    }
    const visit = validResult.data;
    visit.patient = user.id;
    visit.state = "Zaplanowana";
    visit.confirmed = true;
    visit.note = "online";
    visit.examination = `odbyto teleporadę w formie rozmowy telefonicznej \n
    zweryfikowano dane osobowe - pacjent przedstawił się, podał date urodzenia - zgodna z PESEL`;
    visit.visit_kind = VisitKind.NFZ;
    visit.visit_type = [parseInt(DEFAULT_VISIT_TYPE.trim())];
    const myDr = await myDrPromise;
    const myDrUser = await myDr.getPatientByPk(user.id);
    if(myDrUser == null) {
        console.log("MyDR account id=" + user.id + ", PESEL=" + user.pesel + " is not found");
        updateUser({pesel: user.pesel, active: false, id: null});
        locals.message = PUBLIC_UA_DEACTIVATED;
        throw redirect(303, "/app/logout");
    }
    if(!myDrUser.active) {
        console.log("MyDR account id=" + user.id + ", PESEL=" + user.pesel + " is not active");
        updateUser({pesel: user.pesel, active: false});
        locals.message = PUBLIC_UA_DEACTIVATED;
        throw redirect(303, "/app/logout");
    }
    let result = await myDr.makeAppointment(visit);
    if(result.visit && result.visit.doctor) {
        const doctor = await getDoctor(result.visit.doctor);
        if(doctor) {
            result.visit.doctor = doctor.first_name + " " + doctor.last_name;
        }
    }
    return json(result);
}