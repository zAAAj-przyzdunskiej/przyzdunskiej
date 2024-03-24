import { PUBLIC_NO_DECLARATION, PUBLIC_SERVER_ERROR, PUBLIC_UA_NOTACTIVATED, PUBLIC_UNAUTHORIZED } from '$env/static/public';
import { MyDr, type Visit } from '$lib/server/mydr.js';
import { getDoctor } from '$lib/server/user.js';
import { dateToStr } from '$lib/utils.js';
import { json } from '@sveltejs/kit';

type VisitTime = {date: string, timeFrom?: string, [key: string] : any};
function formatTime(timeStr: string| undefined): string {
    if(!timeStr) {
        return "24:00";
    }
    if(timeStr.length > 5) {
        return timeStr.slice(0,5);
    }
    return timeStr;
}
function compareVisit(lVisit: VisitTime, rVisit: VisitTime): number {
    let right = rVisit.date, left = lVisit.date;
    if(right == left) {
        right = rVisit.timeFrom || "24:00";
        left = lVisit.timeFrom || "24:00";
    }
    if(left < right) {
        return -1;
    } else if(right == left) {
        return 0;
    } else {
        return 1;
    }
}
function addVisit(visits: VisitTime[], newVisit: VisitTime) {
    const lastIdx = visits.length - 1
    let index = lastIdx;
    for(; index >= 0 && compareVisit(visits[index], newVisit) > 0; index--);
    if(index == lastIdx) {
        visits.push(newVisit);
    } else {
        visits.splice(index + 1, 0, newVisit);
    }
}
function addVisitDecr(visits: VisitTime[], newVisit: VisitTime) {
    const lastIdx = visits.length - 1
    let index = 0;
    for(; index < visits.length && compareVisit(visits[index], newVisit) > 0; index++);
    if(index == lastIdx) {
        visits.push(newVisit);
    } else {
        visits.splice(index, 0, newVisit);
    }
}

export async function GET({ locals, url}) {
    const user = locals.user;
    if (!user) {
        return json({success: false, httpCode: 401, message: PUBLIC_UNAUTHORIZED});
    }
    //let myDrUser = null
    if(!user.id) {
        return json({success: false, httpCode: 401, message: PUBLIC_NO_DECLARATION });
    }
    try {
        const queryData:any = {};
        const page = url.searchParams.get("page");
        if(page) {
            queryData.page = page;
        }
        const page_size = url.searchParams.get("page_size");
        if(page_size) {
            queryData.page_size = page_size;
        }
        const today = new Date();
        const nowTimeStr = today.getHours().toString().padStart(2, '0') + 
                ":" + today.getMinutes().toString().padStart(2, '0');
        const nowDateStr = dateToStr(today);
        const myDr = await MyDr.newInstance();
        const visitGetter = await myDr.newVisitGetter(user.id.toString(), queryData);
        const upcoming:VisitTime[] = [], past:VisitTime[] = [];
        for (const visit of visitGetter.results) {
            const state = visit.state;
            if(!state || state == "Usunięta" || state == "Anulowana") {
                continue;
            }

            const doctorObj = await getDoctor(visit.doctor);
            console.log("getDoctor id=" + visit.doctor + ", return " + (doctorObj ? doctorObj.first_name : "null"));
            const doctorName = doctorObj ? doctorObj.first_name + " " + doctorObj.last_name : "";
            const {patient, doctor, office, visit_type, latest_modification, ...tmp} = visit;
            const retVisit: VisitTime = {doctor: doctorName, ...tmp};
            retVisit.timeFrom = formatTime(retVisit.timeFrom);
            retVisit.timeTo = formatTime(retVisit.timeTo);
            
            let cmp = compareVisit(retVisit, {date: nowDateStr, timeFrom: nowTimeStr});
            if(cmp > 0) {
                addVisit(upcoming, retVisit)
            } else {
                addVisitDecr(past, retVisit)
            }
        }
        return json({success: true, httpCode: 200, message: "ok", pastVisits: past, upcomingVisits: upcoming});
    } catch (error: any) {
        return json({success: false, httpCode: 500, message: PUBLIC_SERVER_ERROR});
    }
}