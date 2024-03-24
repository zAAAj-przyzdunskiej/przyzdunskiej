import bcrypt from 'bcryptjs';

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
export function checkPesel(pesel: string): boolean {
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
