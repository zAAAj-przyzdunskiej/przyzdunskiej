<script lang="ts">
	import type { ZodIssue } from 'zod';
	export let data;
	let msg = "";
	if(data._msg) {
        msg = msg + data._msg;
    }
	export let form;
</script>
<section class="body-font text-gray-600">
	<div class="container mx-auto px-5 py-24">
		<form method="post">
			<div class="mb-12 flex w-full flex-col text-center">
				<h1 class="title-font mb-4 text-2xl font-medium text-gray-800 sm:text-3xl dark:text-gray-200">Zmień hasło</h1>
				<p class="mx-auto text-base leading-relaxed text-gray-600 lg:w-2/3 dark:text-gray-300">{msg}
					{#if form?.issues}
					<ul class="mb-3 w-full text-left text-base text-red-800 dark:text-yellow-400">
						{#each form.issues as { message }}
							<li class="max-w-[90%] origin-[0_0] truncate pt-[0.37rem] text-sm font-thin italic leading-[2.15] text-red-600 dark:text-yellow-400">
								+ {message}
							</li>
						{/each}
					</ul>
				{/if}
			</p>
			</div>
			<div class="mx-auto flex w-full flex-col items-end space-y-4 px-8 sm:flex-row sm:space-x-4 sm:space-y-0 sm:px-0 lg:w-2/3">
				<div class="relative w-full flex-grow">
					<label for="password" class="text-sm leading-7 text-gray-600 dark:text-gray-300">Nowe hasło</label>
					<input type="password" id="password" name="password" class="w-full rounded border border-gray-300 bg-gray-100 bg-opacity-50 px-3 py-1 text-base leading-8 text-gray-700 outline-none transition-colors duration-200 ease-in-out focus:border-blue-500 focus:bg-transparent focus:ring-2 focus:ring-blue-200" />
				</div>
				<div class="relative w-full flex-grow">
					<label for="pswConfirm" class="text-sm leading-7 text-gray-600 dark:text-gray-300">Potwierdź hasło</label>
					<input type="password" id="pswConfirm" name="pswConfirm" class="w-full rounded border border-gray-300 bg-gray-100 bg-opacity-50 px-3 py-1 text-base leading-8 text-gray-700 outline-none transition-colors duration-200 ease-in-out focus:border-blue-500 focus:bg-transparent focus:ring-2 focus:ring-blue-200" />
				</div>
				<button type="submit" class="rounded border-0 bg-primary px-8 py-2 text-lg text-white hover:bg-blue-600 focus:outline-none">Składać</button>
			</div>
		</form>
	</div>
</section>
