import { type User, PrismaClient, Country, IndentityType, type Address } from '@prisma/client';
import { boolean, number, z } from 'zod';
import bcrypt from 'bcryptjs';
import { signJWT, verifyJWT } from '$lib/server/token.js';
import { JWT_EXPIRES_IN, GSM_LOGIN, GSM_PASS, GSM_URL } from '$env/static/private';
import { 
	PUBLIC_NO_DECLARATION, PUBLIC_UA_NOTACTIVATED, PUBLIC_WRONG_CREDENTIALS, PUBLIC_MSG_PASSWORD, PUBLIC_UA_SUCCEED, PUBLIC_UA_SUCCEED_BUT_SMS,
	PUBLIC_INVALID_EMAIL, PUBLIC_INVALID_PASSWORD, PUBLIC_INVALID_PESEL, PUBLIC_INVALID_PHONE, PUBLIC_INVALID_ZIP,
	PUBLIC_MISSING_PASSWORD, PUBLIC_MISSING_PESEL, PUBLIC_MISSING_PHONE, PUBLIC_MISSING_ZIP, PUBLIC_UA_DEACTIVATED } from '$env/static/public';
import { buildUrlQueryData, checkPesel, getDiff, randomNumber, type Result } from '$lib/utils';
import { ResultCode } from '$lib/utils';
import validator from 'validator'
import { MyDr, MyDrGetter, type MyDrUser, type Staff } from './mydr';

const prisma = globalThis.prisma ?? new PrismaClient()
export type UserLogin = {
    pesel: string,
    password: string
}
export type UserRegister = {
	pesel: string;
    name: string;
    surname: string;
    email?: string;
    telephone: string;
    zipcode: string;

    password?: string;
    passwordConfirm?: string;

	second_telephone?: string;
	date_of_birth?: string;
	sex?: string;
	identity_type?: IndentityType;
	identity_num?: string;
	country?: Country;
	supervisor?: number
	second_name?: string;
	maiden_name?: string;
	place_of_birth?: string;
	internal_card_id?: string;
	blood_type?: string;
	photo?: string;
}
export const userLoginSchema: z.ZodType<UserLogin> = z.object({
	pesel: z.string({required_error: 'PESEL number is required'})
		.min(11, 'PESEL number is invalid')
		.refine(checkPesel, "PESEL number is invalid"),
	password: z.string({required_error: 'Password is required'})
		.min(4, 'Password is invalid')
});
export type LoginUserInput = z.infer<typeof userLoginSchema>;

const zipcodeRegex = /(^\d{5}$)|(^\d{5}-\d{4}$)|(^\d{2}-\d{3}$)/;
export const userRegisterSchema: z.ZodType<UserRegister> = z
	.object({
		pesel: z.string({required_error: 'PESEL number is required'})
				.min(11, 'PESEL number is invalid')
				.refine(checkPesel, "PESEL is invalid"),
		name: z.string({required_error: 'Name is required'})
				.min(1, 'First name is required'),
        surname: z.string({required_error: 'Last name is required'})
				.min(1, 'Last name is required'),
		email: z.string().optional().or(z.string().email( {message: 'Email is invalid'})),
		telephone: z.string({required_error: 'Phone number is required'})
				.min(9, 'Phone number is invalid')
				.refine(validator.isMobilePhone, "Telephone is invalid"),
		// password: z
		// 	.string({
		// 		required_error: 'Password is required'
		// 	})
		// 	.min(1, 'Password is required')
		// 	.min(8, 'Password must be more than 8 characters')
		// 	.max(32, 'Password must be less than 32 characters'),
		// passwordConfirm: z
		// 	.string({
		// 		required_error: 'Confirm your password'
		// 	})
		// 	.min(1, 'Confirm your password'),
		zipcode: z.string({required_error: 'Zipcode is required'})
				.regex(zipcodeRegex, "Zipcode is invalid")
	});
	//.refine((data) => {	}, {
	// 	path: ['passwordConfirm'],
	// 	message: 'Passwords do not match'
	// });
export type RegisterUserInput = z.infer<typeof userRegisterSchema>;

export async function genToken(subject:string) {
	return signJWT({ sub: subject }, { exp: JWT_EXPIRES_IN + " m" });
}
export async function getUserByPesel(pesel:string): Promise<User|null>{
	return prisma.user.findUnique({
        where: { pesel: pesel }
    });
}

export async function login(data: UserLogin): Promise<Result> {
	const user = await prisma.user.findUnique({where: { pesel: data.pesel }});
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
	let ok = res.ok && res.status >= 200 && res.status < 300 ;
	if(!ok) {
		console.log("Message response status code: " + res.status + ", message: " +res.statusText + ". \n" 
			+ await res.text);
		return false;
	}
	return true;
}
export async function changePassword(pesel: string, password: string): Promise<User> {
	password = await bcrypt.hash(password, 12);
	return prisma.user.update({data: {password: password}, where: {pesel: pesel}})
}

export async function resetPassword(pesel: string) {
	let localUser = await prisma.user.findUnique({
		where: { pesel: pesel }
	});

	if(localUser == null || !localUser.active) {
		console.log("User account is not found or inactive: pesel=" + pesel);
		return { success: false, httpCode: ResultCode.BAD_REQUEST, 
			message: PUBLIC_UA_DEACTIVATED};
	}
	if(!localUser.telephone) {
		console.log("Can not reset password, telephone is not registered: pesel=" + pesel);
		return { success: false, httpCode: ResultCode.BAD_REQUEST, 
			message: PUBLIC_MISSING_PHONE};
	}
	let psw = randomNumber(4).toString();
	let hashed = await bcrypt.hash(psw, 12);
	localUser = await prisma.user.update({data: {password: hashed}, where: {pesel: pesel}})
	console.log(psw + " HASH = " + hashed + " , Updated: " + localUser.password);
	if(! (await sendSMS(localUser.telephone, PUBLIC_MSG_PASSWORD + ":  " + psw))) {
		return { success: true, httpCode: ResultCode.OK, user: localUser,
			message: PUBLIC_UA_SUCCEED_BUT_SMS}
	}
	return { success: true, httpCode: ResultCode.OK, message: PUBLIC_UA_SUCCEED}

}
export async function tryRegister(pesel: string): Promise<Result> {
	let localUser = await prisma.user.findUnique({
		where: { pesel: pesel }
	});

	if(localUser != null) {
		if(localUser.active) {
			console.log("User account is already exist and active")
			return { success: false, httpCode: ResultCode.BAD_REQUEST, user: localUser, 
				message: PUBLIC_UA_NOTACTIVATED}
		} 
		console.log("User account already exist but not active: no receive 'Declaration of choice??");
		return { success: false, httpCode: ResultCode.BAD_REQUEST, user: localUser, 
			message: PUBLIC_NO_DECLARATION};
	}

	let myDrUser: MyDrUser|null = await MyDr.newInstance()
				.then(myDr => myDr.getOnePatient({pesel: pesel, active: true})); 
	if(myDrUser != null) {
		if(myDrUser.registration_address) {
			let address:Address = myDrUser.registration_address;
			await prisma.address.upsert({
				where: {id: address.id},
				update: address,
				create: address
			});
			myDrUser.registration_address_id = address.id;
			if(!myDrUser.zipcode && address.postal_code) {
				myDrUser.zipcode = address.postal_code;
			}
		}
		if(myDrUser.residence_address) {
			let address:Address = myDrUser.residence_address;
			await prisma.address.upsert({
				where: {id: address.id},
				update: address,
				create: address
			});
			myDrUser.registration_address_id = address.id;
			if(!myDrUser.zipcode && address.postal_code) {
				myDrUser.zipcode = address.postal_code;
			}
		}
		if(!myDrUser.zipcode) {
			myDrUser.zipcode = "_NA_";
		}
		const {residence_address, registration_address, ...newUser} = myDrUser;
		let psw = randomNumber(4).toString();
		newUser.password = await bcrypt.hash(psw, 12);
		console.log(JSON.stringify(newUser));
		localUser = await prisma.user.create({data: newUser})
		console.log(psw);
		if(! (await sendSMS(localUser.telephone, PUBLIC_MSG_PASSWORD + psw))) {
			return { success: true, httpCode: ResultCode.OK, user: localUser,
				message: PUBLIC_UA_SUCCEED_BUT_SMS}
		}
		return { success: true, httpCode: ResultCode.OK, user: localUser,
			message: PUBLIC_UA_SUCCEED}
	}
	return { success: false, httpCode: ResultCode.OK, message: PUBLIC_NO_DECLARATION, waitingUser:{pesel: pesel}}
}
export async function register(userInfo: UserRegister): Promise<Result> {
	let result = await tryRegister(userInfo.pesel);
	if(result.success) {
		return result;
	}
	if(result.waitingUser) {
		console.log("MyDr account not found. Creating a local account for lead follow-up");
		result.waitingUser = {active: false, ...userInfo};
		prisma.user.create({data: result.waitingUser});
	}
	return result;
}
export async function getDoctor(id: number): Promise<Staff|null> {
	if(!globalThis.doctors) {
        globalThis.doctors = new Map<number, Staff>();
    }
	let doctor:Staff|undefined|null = globalThis.doctors.get(id);
	if(doctor) return doctor;

    const myDr = await MyDr.newInstance();
	doctor = await myDr.getDoctorByPk(id);
	if(doctor) {
		globalThis.doctors.set(doctor.id as number, doctor);
	}
	return doctor;
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