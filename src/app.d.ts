// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { MyDrUser, Staff, Token } from '$lib/server/mydr';
import type { UserRegister } from '$lib/server/user';
import type { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';

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
	var prisma: PrismaClient;
	var myDrToken: Token;
	var doctors: Map<number, Staff>;
}

export {};
