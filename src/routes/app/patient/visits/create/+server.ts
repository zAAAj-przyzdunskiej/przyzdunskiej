import { DEFAULT_VISIT_TYPE, DEFAULT_VISIT_TYPE2 } from '$env/static/private';
import { PUBLIC_FAIL_MYDR, PUBLIC_NO_DECLARATION, PUBLIC_UA_DEACTIVATED, PUBLIC_UNAUTHORIZED } from '$env/static/public';
import { MyDr, VisitKind, type Visit, officeDepartment, depInitTokenReq } from '$lib/server/mydr.js';
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
    const body = (await request.json());
	const validResult = visitSchema.safeParse(body);
    if (!validResult.success) {
        return json({success: false, httpCode: ResultCode.BAD_REQUEST, message:"Proszę wybrać slot", issues: validResult.error.issues });
    }
    const visit = validResult.data;
    const sOffice = visit.office.toString();
    const dep = officeDepartment[sOffice];

    console.log("office = " + sOffice + ", Department = " + dep);
    const isAnotherMyDr = (dep && depInitTokenReq[dep])
    visit.visit_type = isAnotherMyDr ? [parseInt(DEFAULT_VISIT_TYPE2.trim())] : [parseInt(DEFAULT_VISIT_TYPE.trim())];
    //visit.visit_type = [parseInt(DEFAULT_VISIT_TYPE.trim())];
    //visit.patient = user.id;
    visit.state = "Zaplanowana";
    visit.confirmed = true;
    visit.note = "online";
    visit.examination = `odbyto teleporadę w formie rozmowy telefonicznej \n
    zweryfikowano dane osobowe - pacjent przedstawił się, podał date urodzenia - zgodna z PESEL`;
    visit.visit_kind = VisitKind.NFZ;
    const myDr = await MyDr.newInstance(sOffice);
    let myDrUser = null; //isAnotherMyDr ? (user.mydr2id ?  await myDr.getPatientByPk(user.mydr2id) : null) : await myDr.getPatientByPk(user.id);
    if(isAnotherMyDr) {
        if(user.mydr2id) {
            myDrUser = myDr.getPatientByPk(user.mydr2id);
        } else {
            const myDr1 = await MyDr.newInstance("_"); //get default MYDR
            myDrUser = await myDr1.getPatientByPk(user.id);
            if(myDrUser && myDrUser.active) {
                console.log("Creating MyDR2 user. PESEL=" + user.pesel);
                const myDr2Result = await myDr.createPatient(myDrUser); //Create patient in department of MyDR
                if(!myDr2Result.success) {
                    console.log("Can not create patient account in MyDR2. Patient: id=" + user.id + ", PESEL=" + user.pesel 
                        + ", OfficeID: " + visit.office
                        + ", status code: " + myDr2Result.httpCode
                        + ", Message: " + myDr2Result.message);
                    locals.message = PUBLIC_FAIL_MYDR + ". Biuro ID: " + visit.office + ", Operation: create patient";
                    return json({success: false, httpCode: ResultCode.SERVER_ERROR, message: locals.message, visit: {}})
                }
                myDrUser = myDr2Result.patient;
                if(!myDrUser) {
                    console.log("Unknown error: cannot create Patient record in MyDR2");
                    return json({success: false, httpCode: ResultCode.SERVER_ERROR, message: "Backend server is temporary down, please try again later", visit: {}});
                }
                console.log("Update MyDR2 id to user.mydr2id. mydr2id = " + myDrUser.id + ", PESEL=" + user.pesel);
                updateUser({mydr2id: myDrUser.id, pesel: user.pesel});
            }
        }
    } else {
        myDrUser = await myDr.getPatientByPk(user.id);
        if(myDrUser == null) {
            console.log("MyDR account id=" + user.id + ", PESEL=" + user.pesel + " is not found");
            updateUser({pesel: user.pesel, active: false, id: null});
            locals.message = PUBLIC_UA_DEACTIVATED;
            throw redirect(303, "/app/logout");
        }
    }
    
    if(!myDrUser.active) {
        console.log("MyDR account id=" + user.id + ", PESEL=" + user.pesel + " is not active");
        updateUser({pesel: user.pesel, active: false});
        locals.message = PUBLIC_UA_DEACTIVATED;
        throw redirect(303, "/app/logout");
    }
    visit.patient = myDrUser.id;
    let result = await myDr.makeAppointment(visit);
    if(result.visit && result.visit.doctor) {
        const doctor = await getDoctor(result.visit.doctor, myDr);
        if(doctor) {
            result.visit.doctor = doctor.first_name + " " + doctor.last_name;
        }
    }
    return json(result);
}