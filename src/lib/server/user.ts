import bcrypt from 'bcryptjs';
import { signJWT } from '$lib/server/token.js';
import { JWT_EXPIRES_IN, GSM_LOGIN, GSM_PASS, GSM_URL, PINCODE_EXPIRED_IN } from '$env/static/private';
import { 
	PUBLIC_NO_DECLARATION, PUBLIC_UA_NOTACTIVATED, PUBLIC_WRONG_CREDENTIALS, PUBLIC_MSG_PASSWORD, PUBLIC_UA_SUCCEED, PUBLIC_UA_SUCCEED_BUT_SMS,
	PUBLIC_MISSING_PHONE, PUBLIC_UA_DEACTIVATED, PUBLIC_SERVER_ERROR, PUBLIC_UA_EXIST, PUBLIC_PINCODE_EXPIRED } from '$env/static/public';
import { buildUrlQueryData, getDiff, randomNumber, type Address, type Result, type User, type UserLogin, type UserRegister, type VisitTime, compareVisit, dateToStr, formatTime, convertDbTimestampToDate } from '$lib/utils';
import { ResultCode } from '$lib/utils';
import { MyDr, type MyDrUser, type Staff } from './mydr';
import { insert, select, update } from './db';

export async function genToken(subject:string) {
	return signJWT({ sub: subject }, { exp: JWT_EXPIRES_IN + " m" });
}
export async function getUserByPesel(pesel:string): Promise<User|null>{
	let result = await select("SELECT * FROM \"User\" WHERE pesel=$1", [pesel]);
	return result.rows.length > 0 ? result.rows[0] : null;
}
export async function updateUser(user: Partial<User>): Promise<User|null> {
	const result = await update( "User", user, {pesel: user.pesel} )
	let row:User|null = result.rows.length > 0 ? result.rows[0] : null;
	console.log(row);
	return row;
}
export async function createUser(user: Partial<User>): Promise<User|null> {
	const result = await insert("User", user);
	return result.rows.length > 0 ? result.rows[0] : null;
}
export async function saveAddress(address: Address): Promise<Address|null> {
	let ins = true;
	const sId = address.id.toString();
	if(sId.length == 0){
		address.id = 0;
	} 
	if(address.id > 0) {
		const qRes = await select("SELECT id FROM \"Address\" WHERE id=$1", [sId])
		if(qRes.rows.length > 0) {
			ins = false;
		}
	}
	let result = ins? await insert("Address", address) : await update("Address", address, {id: address.id});
	return result.rows.length > 0 ? result.rows[0] : null;
}

export async function login(data: UserLogin): Promise<Result> {
	const user = await getUserByPesel(data.pesel);
	if(!user) {	
		console.log("User account not found");
        return { success: false, message: PUBLIC_WRONG_CREDENTIALS, httpCode: ResultCode.UNAUTHORIZED };
	}
	if(!user.password || !user.active) {
		if(user.active) {
			console.log("User account is active but the password is not set");
			return { success: false, httpCode: ResultCode.BAD_REQUEST, user: user, 
				message: PUBLIC_UA_NOTACTIVATED};
		}
		console.log("User account is not active and the password is not set");
		return { success: false, httpCode: ResultCode.BAD_REQUEST, user: user, 
			message: PUBLIC_NO_DECLARATION};	
	} 
	if(data.password.length <= 4 && user.updatedAt) {
		const now = Date.now();
		console.log("Today, now is: " + now.toString());
		const pswSetTime = convertDbTimestampToDate(user.updatedAt);
		console.log("Password set time is: " + pswSetTime.getTime());

		const maxAge = (parseInt(PINCODE_EXPIRED_IN)*60*1000);
		console.log("Max-age = " + maxAge + " miliseconds");
		if(now > pswSetTime.getTime() +(parseInt(PINCODE_EXPIRED_IN)*60*1000)) {
			return { success: false, message: PUBLIC_PINCODE_EXPIRED, httpCode: ResultCode.UNAUTHORIZED };
		}
	}
	
	const pswMatched = await bcrypt.compare(data.password, user.password);
	if(!pswMatched) {
		console.log("User account not found or password is not matched");
        return { success: false, message: PUBLIC_WRONG_CREDENTIALS, httpCode: ResultCode.UNAUTHORIZED };
	}
	return {success: true, message: 'Logged in', httpCode: ResultCode.OK, user: user };
}

async function sendSMS(phoneNumber:string, message: string): Promise<boolean> {
	if(!phoneNumber.startsWith("48")) {
		phoneNumber = "48" + phoneNumber;
	}
	const urlStr = GSM_URL + "?" + buildUrlQueryData({
		login: GSM_LOGIN, pass: GSM_PASS, recipient: phoneNumber, msg_type: 3, message: message
	});
	let res = await fetch(urlStr);
	let ok = res.status >= 200 && res.status < 300 ;
	if(!ok) {
		console.log("Message response status code: " + res.status + ", message: " +res.statusText + ". \n" 
			+ await res.text);
		return false;
	}
	return true;
}
export async function changePassword(pesel: string, password: string): Promise<User| null> {
	password = await bcrypt.hash(password, 12);
	//return updateUserByPesel({password: password}, pesel)
	let result = await update("User", {password: password}, {pesel: pesel});
	return result.rows.length > 0 ? result.rows[0] : null;
}

export async function resetPassword(pesel: string): Promise<Result> {
	let localUser = await getUserByPesel(pesel);
	if(localUser == null || !localUser.active) {
		let result = await checkUA(localUser, pesel);
		if(!result.success) {
			console.log("User account is not found or inactive: pesel=" + pesel);
			return { success: false, httpCode: ResultCode.BAD_REQUEST, 
				message: PUBLIC_WRONG_CREDENTIALS};
			
		} 
		return result;
	}
	if(!localUser.telephone) {
		console.log("Can not reset password, telephone is not registered: pesel=" + pesel);
		return { success: false, httpCode: ResultCode.BAD_REQUEST, 
			message: PUBLIC_MISSING_PHONE};
	}
	let psw = randomNumber(4).toString();
	let hashed = await bcrypt.hash(psw, 12);
	localUser = await updateUser({pesel: pesel, password: hashed}) as User;
	console.log(psw + " HASH = " + hashed + " , Updated: " + localUser.password);
	if(! (await sendSMS(localUser.telephone, PUBLIC_MSG_PASSWORD + ":  " + psw))) {
		return { success: true, httpCode: ResultCode.OK, user: localUser,
			resultCode: "UA_SUCCEED_BUT_SMS",
			message: PUBLIC_UA_SUCCEED_BUT_SMS}
	}
	return { success: true, httpCode: ResultCode.OK, user: localUser, 
		message: PUBLIC_UA_SUCCEED, 
		resultCode: "UA_SUCCEED",
		phone: localUser.telephone}
}
export async function tryRegister(pesel: string): Promise<Result> {
	let localUser = await getUserByPesel(pesel);
	return checkUA(localUser, pesel);
}
export async function checkUA(localUser: User|null, pesel: string): Promise<Result> {
	if(localUser != null && localUser.id && localUser.active) {
		console.log("User account is already exist and active")
		return { success: true, httpCode: ResultCode.OK, user: localUser, 
			message: PUBLIC_UA_EXIST, resultCode: "UA_EXIST"}	
	}
	const myDr = await MyDr.newInstance();
	let myDrUser: MyDrUser|null = null;
	if(localUser != null && localUser.id) {
		myDrUser = await myDr.getPatientByPk(localUser.id);
		if(myDrUser?.active) {
			let declr = await myDr.getOneDeclaration(localUser.id);
			myDrUser.active = (declr != null)
		}
	} else {
		myDrUser = await myDr.getOnePatient({pesel: pesel, active: true}); 
	}
	if(myDrUser == null || !myDrUser.active) {
		console.log("MyDr account does not exist or not active: no receive 'Declaration of choice??");
		const result:Result = { success: false, httpCode: ResultCode.BAD_REQUEST, message: PUBLIC_NO_DECLARATION, resultCode: "NO_DECLARATION"}
		if(localUser) {
			result.user = localUser;
		} else {
			result.waitingUser = {pesel: pesel}
		}
		return result;
	}

	let phone = null;
	if(localUser != null && localUser.telephone) {
		phone = localUser.telephone;
	}

	if(myDrUser.registration_address) {
		let address:Address = myDrUser.registration_address;
		let saved = await saveAddress(address);
		if(saved) {
			myDrUser.registration_address_id = saved.id;
		}
		if(!myDrUser.zipcode && address.postal_code) {
			myDrUser.zipcode = address.postal_code;
		}
	}
	if(myDrUser.residence_address) {
		let address:Address = myDrUser.residence_address;
		let saved = await saveAddress(address);
		if(saved) {
			myDrUser.residence_address_id = saved.id;
		}
		if(!myDrUser.zipcode && address.postal_code) {
			myDrUser.zipcode = address.postal_code;
		}
	}
	if(!myDrUser.zipcode) {
		myDrUser.zipcode = "_NA_";
	}
	const {residence_address, registration_address, ...newUser} = myDrUser;
	if(phone) {
		newUser.telephone = phone;
	}
	let psw = randomNumber(4).toString();
	newUser.password = await bcrypt.hash(psw, 12);
	//console.log(JSON.stringify(newUser));
	localUser = await createUser(newUser) as User;
	//console.log(psw);
	if(! (await sendSMS(localUser.telephone, PUBLIC_MSG_PASSWORD + psw))) {
		return { success: true, httpCode: ResultCode.OK, user: localUser,
			message: PUBLIC_UA_SUCCEED_BUT_SMS, resultCode: "UA_SUCCEED_BUT_SMS"}
	}
	return { success: true, httpCode: ResultCode.OK, user: localUser, message: PUBLIC_UA_SUCCEED, resultCode: "UA_SUCCEED"}
}
	
export async function register(userInfo: UserRegister): Promise<Result> {
	let result = await tryRegister(userInfo.pesel);
	if(result.success) {
		return result;
	}
	if(result.waitingUser) {
		console.log("MyDr account not found. Creating a local account for lead follow-up");
		result.waitingUser = {active: false, ...userInfo};
		createUser(result.waitingUser);
	}
	return result;
}
export async function getDoctor(id: number, myDr?: MyDr): Promise<Staff|null> {
	let doctor:Staff|undefined|null = globalThis.doctors.get(id);
	if(doctor) return doctor;

	console.log("querying doctor from MyDr");
	if(!myDr) {
		myDr = await MyDr.newInstance();
	}
    
	doctor = await myDr.getDoctorByPk(id);
	if(doctor) {
		globalThis.doctors.set(doctor.id as number, doctor);
	}
	return doctor;
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

export async function getVisits(userId:string, page?: string|null, page_size?: string|null): Promise<Result> {
	let queryData:any = null;
	if(page && page_size) {
		queryData = {page: page, page_size:page_size}
	}
	const today = new Date();
	const nowTimeStr = today.getHours().toString().padStart(2, '0') + 
			":" + today.getMinutes().toString().padStart(2, '0');
	const nowDateStr = dateToStr(today);
	try {
        const upcoming:VisitTime[] = [], past:VisitTime[] = [];
		for(const dep of globalThis.myDrToken.keys()) {
			const myDr = await MyDr.newInstance(null, dep);
			const visitGetter = await myDr.newVisitGetter(userId, queryData);
			for (const visit of visitGetter.results) {
				const state = visit.state;
				if(!state || state == "Usunięta" || state == "Anulowana") {
					continue;
				}

				const doctorObj = await getDoctor(visit.doctor, myDr);
				//console.log("getDoctor id=" + visit.doctor + ", return " + (doctorObj ? doctorObj.first_name : "null"));
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
		}
        return {success: true, httpCode: 200, message: "ok", pastVisits: past, upcomingVisits: upcoming};
    } catch (error: any) {
		console.log("Failed to get visits " + error);
        return {success: false, httpCode: 500, message: PUBLIC_SERVER_ERROR};
    }
}
async function updateMyDr(userInfo: UserRegister, myDrUser: User): Promise<User> {
	const myDr = await MyDr.newInstance();
	let data = getDiff(userInfo as any, myDrUser as any);
	if(Object.keys(data).length == 0) {
		return myDrUser;
	} 	
	data.id = myDrUser.id;
	if(!data.name) data.name = myDrUser.name;
	if(!data.surname) data.surname = myDrUser.surname;
	let result = await myDr.updatePatient(data);
	return result.patient;
}
if(!globalThis.doctors) {
	globalThis.doctors = new Map<number, Staff>();
}
// export async function editProfile(userInfo: UserRegister, myDrUser: User|null): Promise<Result>{
	
// 	let localUser = await prisma.user.findUnique({
// 		where: { email: userInfo.email }
// 	});
// 	if(!localUser) {
// 		return {success: false, httpCode: ResultCode.BAD_REQUEST, 
// 			message: "User account is not found: " + userInfo.email}
// 	}

// 	if(myDrUser === null) {
// 		localUser.active = false;
// 		let newUser = prisma.user.update({
// 			where: { email: userInfo.email}, 
// 			data: {active: false}
// 		});
// 		return {success: false, httpCode: ResultCode.FORBIDDEN, userPromise: newUser, 
// 			message: "Disabled account: MyDr account no longer exist"}
// 	}

// 	myDrUser = await updateMyDr(userInfo, myDrUser);

// 	let data = getDiff(myDrUser, localUser as any);
// 	if(Object.keys(data).length == 0) {
// 		return {success: true, httpCode: ResultCode.OK, 
// 			message: "Ignored update: all fields values are the same with DB"}
// 	}
// 	let newUser = prisma.user.update({
// 		where: { email: userInfo.email}, 
// 		data: data
// 	});
// 	return {success: true, httpCode: ResultCode.OK, userPromise: newUser, 
// 		message: "OK"}
// }
// export async function changePassword(params:type) {
// 	const hashedPassword = bcrypt.hash(userInfo.password, 12);
// 	userInfo.password = await hashedPassword;

// }