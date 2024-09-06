// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Pool } from '$lib/server/db';
import type { MyDrUser, Staff, Token } from '$lib/server/mydr';
import type { User, UserRegister } from '$lib/utils';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			token: string | null;
			user: User | null;
			regisUser: UserRegister | null;
			header: string, null;
			message: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	var dbPool: Pool;
	var myDrToken: Map<string, Token>;
	var doctors:Map<number, Staff>;
}

export {};
