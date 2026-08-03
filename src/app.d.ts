// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Pool } from '$lib/server/db';
import type { MyDrUser, Staff } from '$lib/server/mydr';
import type { StoredToken } from '$lib/server/mydrAuth';
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
	/**
	 * Process memo for MyDr tokens — only a cache in front of the database; the
	 * source of truth is the "MyDrToken" table (see $lib/server/mydrAuth).
	 */
	var myDrToken: Map<string, StoredToken>;
	var doctors:Map<number, Staff>;
}

export {};
