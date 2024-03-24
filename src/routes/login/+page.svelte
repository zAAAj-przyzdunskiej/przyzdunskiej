<script lang="ts">
	import { enhance } from '$app/forms';
	import { PUBLIC_MISSING_PESEL } from '$env/static/public';
	import type { ZodIssue } from 'zod';

	export let form;
	let peselInput:string = "";
	const resetPsw = async () => {
		if(!peselInput) {
			alert(PUBLIC_MISSING_PESEL);
			return;
		}
		let cfgReq = {
            method: "POST",
            body: JSON.stringify({pesel: peselInput})
        };
        let response = await fetch('/password/reset/', cfgReq);
		const resObj = await response.json();
		if (resObj.success) {
			alert("Twoje nowe hasło zostało wysłane SMS-em. Proszę zalogować się przy użyciu nowego hasła");
		}
	}
</script>

<section>
	<div class="container items-center py-5">
		<div class="g-6 flex h-full flex-wrap items-center justify-center lg:justify-between">
			<!-- Left column container with background-->
			<div class="mb-12 md:mb-0 md:w-8/12 lg:w-6/12">
				<img src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg" class="w-full" alt="Phone" />
			</div>

			<!-- Right column container with form -->
			<div class="md:w-8/12 lg:ml-6 lg:w-5/12">
				<form method="post" use:enhance>
					<!-- Pesel input -->
					<div class="relative mb-6">
						<label for="pesel" class="text-neutral-500 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[2.15] text-primary">Numer PESEL </label>
						<input bind:value={peselInput} type="text" id="pesel" name="pesel" required class="peer block min-h-[auto] w-full rounded border-2 bg-transparent px-3 py-[0.32rem] text-gray-900 dark:text-white" />
					</div>

					<!-- Password input -->
					<div class="relative mb-6">
						<label for="password" class="text-neutral-500 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[2.15] text-primary"> Hasło </label>
						<input type="password" id="password" name="password" required class="peer block min-h-[auto] w-full rounded border-2 bg-transparent px-3 py-[0.32rem] text-gray-900 dark:text-white" />
					</div>
					<div class="relative mb-6">
						{#if form?.issues}
							<ul class="mb-3 w-full text-left text-base text-red-800 dark:text-yellow-400">
								{#each form.issues as { message }}
									<li class="max-w-[90%] origin-[0_0] truncate pt-[0.37rem] text-sm font-thin italic leading-[2.15] text-red-600 dark:text-yellow-400">
										+ {message}
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Remember me checkbox -->
					<div class="mb-6 flex items-center justify-between">
						<div class="mb-[0.125rem] block min-h-[1.5rem] pl-[1.5rem]">
							<input
								class="border-neutral-300 dark:border-neutral-600 relative float-left -ml-[1.5rem] mr-[6px] mt-[0.15rem] h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
								type="checkbox"
								value=""
								id="exampleCheck3"
								checked />
							<label class="inline-block pl-[0.15rem] text-gray-900 hover:cursor-pointer dark:text-white" for="exampleCheck3"> Remember me </label>
						</div>

						<!-- Forgot password link -->
						<a href="#!" class="hover:text-primary-600 focus:text-primary-600 active:text-primary-700 dark:text-primary-400 dark:hover:text-primary-500 dark:focus:text-primary-500 dark:active:text-primary-600 text-primary transition duration-150 ease-in-out">Forgot password?</a>
					</div>

					<!-- Submit button -->
					<button
						type="submit"
						class="hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700 inline-block w-full rounded bg-primary px-7 pb-2.5 pt-3 text-sm font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]">
						Zalogować się
					</button>

					<!-- Divider -->
					<div class="before:border-neutral-300 after:border-neutral-300 my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t after:mt-0.5 after:flex-1 after:border-t">
						<p class="dark:text-neutral-200 mx-4 mb-0 text-center font-semibold text-gray-600 dark:text-gray-300">OR</p>
					</div>
					<button on:click={(_) => resetPsw()}
						class="hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700 inline-block w-full rounded bg-primary px-7 pb-2.5 pt-3 text-sm font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]">
						Otrzymaj hasło SMS-em
					</button>
				</form>
			</div>
		</div>
	</div>
</section>
