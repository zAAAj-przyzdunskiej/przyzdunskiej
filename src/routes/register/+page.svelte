<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ZodIssue } from 'zod';

	export let form;
	export let data;
</script>

<section class="body-font text-gray-600">
	<div class="container mx-auto flex flex-wrap items-center px-5 py-3 lg:py-24">
		<div class="w-full pr-0 md:pr-16 lg:pr-0 ">
			<h1 class="title-font text-3xl font-medium text-primary dark:text-primaryLight">Witamy w Przychodni przy Zduńskiej.</h1>
			<p class="mb-2 text-xl leading-relaxed text-gray-800 dark:text-gray-200">Opieką otaczamy Pacjentów zamieszkujących Włocławek i okoliczne miejscowości (kod pocztowy rozpoczynający się od 87-xxx)</p>
			<p class="text-lg text-pretty italic font-light leading-relaxed text-gray-600 dark:text-gray-300">
				Panel Pacjenta umożliwiający otrzymanie e-recept, e-skierowań a także zamówienia teleporady lekarskiej dostępny jest WYŁĄCZNIE dla Pacjentów Przychodni
			</p>
			<p class="text-lg leading-relaxed italic font-light  text-gray-600 dark:text-gray-300">PESEL i numer telefonu służą w naszym systemie jako czynniki uwierzytelniające. W przypadku zmiany numeru telefonu prosimy o kontakt telefoniczny z Przychodnią </p>
			<p class="mt-2 text-lg leading-relaxed italic font-light text-gray-600 dark:text-gray-300">{data.message}</p>
		</div>
		<div class="w-full pr-0 md:pr-16 lg:pr-0">
			<p class="text-lg leading-relaxed  text-gray-600 dark:text-gray-300"><i class="font-light ">Czy chcesz zostać Naszym Pacjentem? </i>
				<a class="ml-3 text-2xl text-primary dark:text-primaryLight font-semibold" href="https://form.jotform.com/242495065846365">Kliknij tutaj!</a></p>
		</div>
		<!-- <div class="mt-10 w-full rounded-lg bg-gray-100 p-8 md:ml-auto md:mt-0">
			
			<script type="text/javascript" src="https://form.jotform.com/jsform/240191673441049"></script> 
			<iframe id="JotFormIFrame-240191673441049" src="https://form.jotform.com/240191673441049" frameborder="0" 
				class="w-full h-full max-w-full border-none" scrolling="no"
				on:load={() => window.parent.scrollTo(0,0)} allowtransparency={true} allow="geolocation; microphone; camera; fullscreen"
				title="DEKLARACJA WYBORU ŚWIADCZENIODAWCY UDZIELAJĄCEGO ŚWIADCZEŃ Z ZAKRESU PODSTAWOWEJ OPIEKI ZDROWOTNEJ ORAZ LEKARZA PODSTAWOWEJ OPIEKI ZDROWOTNEJ, PIELĘGNIARKI PODSTAWOWEJ OPIEKI ZDROWOTNEJ I POŁOŻNEJ PODSTAWOWEJ OPIEKI ZDROWOTNEJ" > </iframe>
			<script src="https://form.jotform.com/s/umd/latest/for-form-embed-handler.js"></script>
			<script>
				window.jotformEmbedHandler("iframe[id='JotFormIFrame-240191673441049'", 'https://form.jotform.com/');
			</script>
		</div> -->
	</div>
</section>
