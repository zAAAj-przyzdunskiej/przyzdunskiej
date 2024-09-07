import bcrypt from 'bcryptjs';
import { z } from 'zod';
import validator from 'validator';
import { PUBLIC_INVALID_EMAIL, PUBLIC_INVALID_PASSWORD, PUBLIC_INVALID_PESEL, PUBLIC_INVALID_PHONE, PUBLIC_INVALID_ZIP, PUBLIC_MISSING_PASSWORD, PUBLIC_MISSING_PESEL, PUBLIC_MISSING_PHONE, PUBLIC_MISSING_ZIP } from '$env/static/public';
export type VisitTime = {date: string, timeFrom?: string, [key: string] : any};
export type Result = {
	success: boolean;
	message: string;
	httpCode: number;
	[key: string]: any;
};

export enum ResultCode {
	OK = 200, CREATED = 201, ACCEPTED = 202,
	BAD_REQUEST = 400, UNAUTHORIZED = 401, FORBIDDEN = 403, NOT_FOUND = 404,
	SERVER_ERROR = 500
}
export function getDiff(newVals: any, oldVals: any) {
	const diff: any = {};
	Object.keys(newVals).forEach((key) => {
		if (newVals[key] == null || newVals[key] != oldVals[key]) {
			diff[key] = newVals[key];
		}
	});
	return diff;
}
export function removeNulls(obj: any) {
	Object.keys(obj).forEach((key) => {
		if (obj[key] === null || obj[key] === undefined) {
			delete obj[key];
		}
	});
}
export async function randomStr(len: number, rounds: number | undefined): Promise<string> {
	if (len < 1) return "";
	if (len > 24) {
		len = 24;
	}
	len = -1 * len - 1;
	let randomStr = await bcrypt.genSalt(rounds);
	return randomStr.slice(len, -1);
}
export function randomNumber(len: number): number {
	if (len > 16) len = 16
	if (len < 1) return 0;
	let f = Math.random();
	const p = Math.pow(10, len - 1);
	const pp = p * 10;
	let nR = 0;
	while (nR < p && f > 0) {
		f = f * pp;
		let n = Math.floor(f);
		f = f - n;
		while (n > 0) {
			const d = n % 10;
			if (d > 0) {
				nR = nR * 10 + d;
				if (nR > p) break;
			}
			n = (n - d) / 10;
		}
	}
	return nR;
}
export async function getHash(str: string): Promise<string> {
	return bcrypt.hash(str, 12);
}
export function buildUrlQueryData(data?: object | null): string {
	let q = "";
	if (data === null || data === undefined) {
		return q;
	}
	for (const [k, v] of Object.entries(data)) {
		q = q + encodeURIComponent(k) + '=' + encodeURIComponent(v) + '&';
	}
	return q.slice(0, -1);
}
export function checkPesel(pesel: string|null|undefined): boolean {
	if(!pesel) {
		return false;
	}
	pesel = pesel.trim();
	if(pesel.length !== 11) {
		return false;
	}
	//console.log("pesel is not null and length == 11");
	const monthWithCentury = Number(pesel.substring(2, 4));

	// Century is encoded in month: https://en.wikipedia.org/wiki/PESEL.
	if (!monthWithCentury || monthWithCentury % 20 > 12) {
		return false;
	}

	const day = Number(pesel.substring(4, 6));
	if (!day || day < 1 || day > 31) {
		return false;
	}

	if (!/^[0-9]{11}$/u.test(pesel)) {
		return false;
	}

	const times = [1, 3, 7, 9];
	const digits = `${pesel}`.split(``).map((digit) => {
		return parseInt(digit, 10);
	});

	const [dig11] = digits.splice(-1);

	const control =
		digits.reduce((previousValue, currentValue, index) => {
			return previousValue + currentValue * (times[index % 4] as number);
		}) % 10;

	return 10 - (control === 0 ? 10 : control) === dig11;
}

export function dateToStr(date: Date): string {
	if (date === null) {
		return "";
	}
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
	const year = date.getFullYear();
	return `${year}-${month}-${day}`;
}
export function formatTime(timeStr: string| undefined): string {
    if(!timeStr) {
        return "24:00";
    }
    if(timeStr.length > 5) {
        return timeStr.slice(0,5);
    }
    return timeStr;
}
export function getTimeStampStr(date: Date, dtSep?:string|null):string {
	if(!dtSep) {
		dtSep = " ";
	}
	const dateStr = dateToStr(date);
	return dateStr + dtSep + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}
export function compareVisit(lVisit: VisitTime, rVisit: VisitTime): number {
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
export enum IndentityType {
	passport = 'passport',
	residence_card = 'residence_card',
	id_card = 'id_card',
	ekuz = 'ekuz',
	foreign_national_id = 'foreign_national_id',
	foreign_driver_license = 'foreign_driver_license',
	others = 'others',
	none = 'none',
	nn = 'nn',
	nw = 'nw'
};
export enum Role {
	ADMIN = 'ADMIN',
	DOCTOR = 'DOCTOR',
	PATIENT = 'PATIENT',
	RECEPTIONIST = 'RECEPTIONIST'
};
export enum Rights {
	X = 'X',
	WE = 'WE',
	IB = 'IB',
	AZ = 'AZ',
	IN = 'IN',
	WP = 'WP',
	ZK = 'ZK',
	PO = 'PO',
	IW = 'IW'
};
export enum Country {
	AF = 'AF',
	DAX = 'DAX',
	AL = 'AL',
	DZ = 'DZ',
	AS = 'AS',
	AD = 'AD',
	AO = 'AO',
	AI = 'AI',
	AQ = 'AQ',
	AG = 'AG',
	AR = 'AR',
	AM = 'AM',
	AW = 'AW',
	AU = 'AU',
	AT = 'AT',
	AZ = 'AZ',
	BS = 'BS',
	BH = 'BH',
	BD = 'BD',
	BB = 'BB',
	BY = 'BY',
	BE = 'BE',
	BZ = 'BZ',
	BJ = 'BJ',
	BM = 'BM',
	BT = 'BT',
	BO = 'BO',
	BQ = 'BQ',
	BA = 'BA',
	BW = 'BW',
	BV = 'BV',
	BR = 'BR',
	IO = 'IO',
	BN = 'BN',
	BG = 'BG',
	BF = 'BF',
	BI = 'BI',
	CV = 'CV',
	KH = 'KH',
	CM = 'CM',
	CA = 'CA',
	KY = 'KY',
	CF = 'CF',
	TD = 'TD',
	CL = 'CL',
	CN = 'CN',
	CX = 'CX',
	CC = 'CC',
	CO = 'CO',
	KM = 'KM',
	CG = 'CG',
	CD = 'CD',
	CK = 'CK',
	CR = 'CR',
	CI = 'CI',
	HR = 'HR',
	CU = 'CU',
	CW = 'CW',
	CY = 'CY',
	CZ = 'CZ',
	DK = 'DK',
	DJ = 'DJ',
	DM = 'DM',
	DO = 'DO',
	EC = 'EC',
	EG = 'EG',
	SV = 'SV',
	GQ = 'GQ',
	ER = 'ER',
	EE = 'EE',
	SZ = 'SZ',
	ET = 'ET',
	FK = 'FK',
	FO = 'FO',
	FJ = 'FJ',
	FI = 'FI',
	FR = 'FR',
	GF = 'GF',
	PF = 'PF',
	TF = 'TF',
	GA = 'GA',
	GM = 'GM',
	GE = 'GE',
	DE = 'DE',
	GH = 'GH',
	GI = 'GI',
	GR = 'GR',
	GL = 'GL',
	GD = 'GD',
	GP = 'GP',
	GU = 'GU',
	GT = 'GT',
	GG = 'GG',
	GN = 'GN',
	GW = 'GW',
	GY = 'GY',
	HT = 'HT',
	HM = 'HM',
	VA = 'VA',
	HN = 'HN',
	HK = 'HK',
	HU = 'HU',
	IS = 'IS',
	IN = 'IN',
	ID = 'ID',
	IR = 'IR',
	IQ = 'IQ',
	IE = 'IE',
	IM = 'IM',
	IL = 'IL',
	IT = 'IT',
	JM = 'JM',
	JP = 'JP',
	JE = 'JE',
	JO = 'JO',
	KZ = 'KZ',
	KE = 'KE',
	KI = 'KI',
	KW = 'KW',
	KG = 'KG',
	LA = 'LA',
	LV = 'LV',
	LB = 'LB',
	LS = 'LS',
	LR = 'LR',
	LY = 'LY',
	LI = 'LI',
	LT = 'LT',
	LU = 'LU',
	MO = 'MO',
	MK = 'MK',
	MG = 'MG',
	MW = 'MW',
	MY = 'MY',
	MV = 'MV',
	ML = 'ML',
	MT = 'MT',
	MH = 'MH',
	MQ = 'MQ',
	MR = 'MR',
	MU = 'MU',
	YT = 'YT',
	MX = 'MX',
	FM = 'FM',
	MD = 'MD',
	MC = 'MC',
	MN = 'MN',
	ME = 'ME',
	MS = 'MS',
	MA = 'MA',
	MZ = 'MZ',
	MM = 'MM',
	NA = 'NA',
	NR = 'NR',
	NP = 'NP',
	NL = 'NL',
	NC = 'NC',
	NZ = 'NZ',
	NI = 'NI',
	NE = 'NE',
	NG = 'NG',
	NU = 'NU',
	NF = 'NF',
	KP = 'KP',
	MP = 'MP',
	NO = 'NO',
	OM = 'OM',
	PK = 'PK',
	PW = 'PW',
	PS = 'PS',
	PA = 'PA',
	PG = 'PG',
	PY = 'PY',
	PE = 'PE',
	PH = 'PH',
	PN = 'PN',
	PL = 'PL',
	PT = 'PT',
	PR = 'PR',
	QA = 'QA',
	RE = 'RE',
	RO = 'RO',
	RU = 'RU',
	RW = 'RW',
	BL = 'BL',
	SH = 'SH',
	KN = 'KN',
	LC = 'LC',
	MF = 'MF',
	PM = 'PM',
	VC = 'VC',
	WS = 'WS',
	SM = 'SM',
	ST = 'ST',
	SA = 'SA',
	SN = 'SN',
	RS = 'RS',
	SC = 'SC',
	SL = 'SL',
	SG = 'SG',
	SX = 'SX',
	SK = 'SK',
	SI = 'SI',
	SB = 'SB',
	SO = 'SO',
	ZA = 'ZA',
	GS = 'GS',
	KR = 'KR',
	SS = 'SS',
	ES = 'ES',
	LK = 'LK',
	SD = 'SD',
	SR = 'SR',
	SJ = 'SJ',
	SE = 'SE',
	CH = 'CH',
	SY = 'SY',
	TW = 'TW',
	TJ = 'TJ',
	TZ = 'TZ',
	TH = 'TH',
	TL = 'TL',
	TG = 'TG',
	TK = 'TK',
	TO = 'TO',
	TT = 'TT',
	TN = 'TN',
	TR = 'TR',
	TM = 'TM',
	TC = 'TC',
	TV = 'TV',
	UG = 'UG',
	UA = 'UA',
	AE = 'AE',
	GB = 'GB',
	UM = 'UM',
	US = 'US',
	UY = 'UY',
	UZ = 'UZ',
	VU = 'VU',
	VE = 'VE',
	VN = 'VN',
	VG = 'VG',
	VI = 'VI',
	WF = 'WF',
	EH = 'EH',
	YE = 'YE',
	ZM = 'ZM',
	ZW = 'ZW'
};
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

export type Address = {
	id: number
	country: Country
	street: string | null
	street_number: string | null
	flat_number: string | null
	postal_code: string | null
	city: string | null
	province: string | null
}
export type User = {

	pesel: string
	telephone: string
	email: string | null
	id: number | null
	name: string | null
	surname: string | null
	second_telephone: string | null
	date_of_birth: string | null
	sex: string | null
	identity_type: IndentityType | null
	identity_num: string | null
	country: Country | null
	supervisor: number | null
	nfz: string | null
	rights: Rights | null
	second_name: string | null
	maiden_name: string | null
	place_of_birth: string | null
	internal_card_id: string | null
	blood_type: string | null
	teryt: number | null
	active: boolean | null
	zipcode: string
	password: string | null
	role: Role[]
	photo: string | null
	registration_address_id: number | null
	residence_address_id: number | null
	createdAt: string | null
	updatedAt: string | null
	myDR2Id: number | null
}
export const userLoginSchema: z.ZodType<UserLogin> = z.object({
	pesel: z.string({required_error: PUBLIC_MISSING_PESEL})
		.min(11, PUBLIC_INVALID_PESEL)
		.refine(checkPesel, PUBLIC_INVALID_PESEL),
	password: z.string({required_error: PUBLIC_MISSING_PASSWORD})
		.min(4, PUBLIC_INVALID_PASSWORD)
});
export type LoginUserInput = z.infer<typeof userLoginSchema>;

const zipcodeRegex = /(^\d{5}$)|(^\d{5}-\d{4}$)|(^\d{2}-\d{3}$)/;
export const userRegisterSchema: z.ZodType<UserRegister> = z
	.object({
		pesel: z.string({required_error: PUBLIC_MISSING_PESEL})
				.min(11, PUBLIC_INVALID_PESEL)
				.refine(checkPesel, PUBLIC_INVALID_PESEL),
		name: z.string({required_error: 'Name is required'})
				.min(1, 'First name is required'),
        surname: z.string({required_error: 'Last name is required'})
				.min(1, 'Last name is required'),
		email: z.string().optional().or(z.string().email( {message: PUBLIC_INVALID_EMAIL})),
		telephone: z.string({required_error: PUBLIC_MISSING_PHONE})
				.min(9, PUBLIC_INVALID_PHONE)
				.refine(validator.isMobilePhone, PUBLIC_INVALID_PHONE),
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
		zipcode: z.string({required_error: PUBLIC_MISSING_ZIP})
				.regex(zipcodeRegex, PUBLIC_INVALID_ZIP)
	});
	//.refine((data) => {	}, {
	// 	path: ['passwordConfirm'],
	// 	message: 'Passwords do not match'
	// });
export type RegisterUserInput = z.infer<typeof userRegisterSchema>;
export function convertDbTimestampToDate(dbTimestamp: string) {
	return new Date(dbTimestamp);
}
