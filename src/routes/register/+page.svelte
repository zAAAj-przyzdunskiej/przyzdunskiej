<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ZodIssue } from 'zod';

	export let form;
    export let data;
</script>

<section class="text-gray-600 body-font">
    <div class="container px-5 py-24 mx-auto flex flex-wrap items-center">
      <div class="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
        <h1 class="title-font font-medium text-3xl text-gray-800 dark:text-gray-200">Dołącz do plemienia zdrowia</h1>
        <p class="leading-relaxed mt-4 text-gray-600 dark:text-gray-300">{data.message}
        </p>
        <p class="leading-relaxed mt-4">
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
    <div class="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
        <h2 class="text-gray-900 text-lg font-medium title-font mb-5">Załóż konto</h2>
		<form method="post" action="?/registerOrFollowup" use:enhance>
			<div class="relative mb-4">
				<label for="pesel" class="leading-7 text-sm text-gray-600">PESEL</label>
				<input value="{data.user.pesel}" type="pesel" id="pesel" name="pesel" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
			</div>
			<div class="relative mb-4">
			<label for="name" class="leading-7 text-sm text-gray-600">Imię</label>
			<input value="{data.user.name}" type="name" id="name" name="name" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
			</div>
			<div class="relative mb-4">
				<label for="surname" class="leading-7 text-sm text-gray-600">Nazwisko</label>
				<input value="{data.user.surname}" type="surname" id="surname" name="surname" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
			</div>
			<div class="relative mb-4">
			<label for="email" class="leading-7 text-sm text-gray-600">Email</label>
			<input value="{data.user.email}" type="email" id="email" name="email" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
			</div>
			<div class="relative mb-4">
				<label for="telephone" class="leading-7 text-sm text-gray-600">Telefon</label>
				<input value="{data.user.telephone}" type="tel" id="telephone" name="telephone" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
			</div>
			<div class="relative mb-4">
				<label for="zipcode" class="leading-7 text-sm text-gray-600">Kod pocztowy</label>
				<input value="{data.user.zipcode}" type="zipcode" id="zipcode" name="zipcode" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
			</div>
			<button class="text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-primary rounded text-lg">Składać</button>
		</form>
        <p class="text-xs text-gray-500 mt-3">Będziemy z Tobą w kolejnych krokach</p>
      </div>
    </div>
  </section>