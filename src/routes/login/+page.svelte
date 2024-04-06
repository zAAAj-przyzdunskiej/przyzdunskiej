<script lang="ts">
	import { enhance } from '$app/forms';
	import { PUBLIC_MISSING_PESEL, PUBLIC_MSG_PASSWORD_SENT } from '$env/static/public';
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

	export let data;
	export let form;
	const countDown = writable(0);
	let intvCountDown:NodeJS.Timeout;
	function startCountDown() {
		countDown.set(180);
		intvCountDown = setInterval(() => {
			countDown.update(count => count - 1);
			if($countDown == 0) {
				clearInterval(intvCountDown)
			}
		}, 1000)
	}
	const isLoading = writable(false);
	let peselInput:string = data.pesel || "";
	let mDown = false;
	const resetPsw = async () => {
		if(!mDown) return;
		mDown = false;
		isLoading.set(true);
		startCountDown();
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
			alert(PUBLIC_MSG_PASSWORD_SENT + resObj.phone);
		}
		isLoading.set(false);
	}

	onDestroy(()=>{
		if($countDown > 0)
			clearInterval(intvCountDown);
	})
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
				<!-- svelte-ignore a11y-autofocus -->
				<form method="post" use:enhance >
					<!-- Pesel input -->
					<span class="text-gray-600 dark:text-gray-300 mb-5">{data.message || ""}</span>
					<div class="relative mb-2">
						<label for="pesel" class="text-neutral-500 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[2.15] text-primary">Numer PESEL </label>
						<input bind:value={peselInput} type="text" id="pesel" name="pesel" required class="peer block min-h-[auto] w-full rounded border-2 bg-transparent px-3 py-[0.32rem] text-gray-900 dark:text-white" />
					</div>
					<button on:mousedown={()=>mDown = true} on:mouseup={(_) => resetPsw()} disabled={$countDown > 0} 
						class="hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700 inline-block w-full rounded bg-primary px-7 pb-2.5 pt-3 text-sm font-medium leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]">
						{#if $isLoading}
						<div role="status" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
						<span>Ładowanie...</span>
						{:else if $countDown > 0}
						<i>Wysłać hasło ponownie? Proszę czekać {$countDown} sekund...</i>
						{:else}
						<span class="uppercase ">Otrzymaj hasło SMS-em</span>
						{/if}
					</button>

					<span class="text-gray-600 dark:text-gray-300 mb-5">Jednorazowe hasło do serwisu prześlemy na Twój numer telefonu podany w Przychodni. </span>
					<br/>

					<!-- Password input -->
					<div class="relative mb-2 mt-4">
						<label for="password" class="text-neutral-500 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[2.15] text-primary"> Hasło </label>
						<input type="password" id="password" name="password" required class="peer block min-h-[auto] w-full rounded border-2 bg-transparent px-3 py-[0.32rem] text-gray-900 dark:text-white" />
					</div>
					<!-- Submit button -->
					<button
						type="submit" 
						class="hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700 inline-block w-full rounded bg-primary px-7 pb-2.5 pt-3 text-sm font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]">
						Zalogować się
					</button>
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
				</form>
			</div>
		</div>
	</div>
</section>
