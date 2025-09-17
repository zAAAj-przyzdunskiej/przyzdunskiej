<script>
	import '../app.pcss';
	import { browser } from '$app/environment';
	import Logo from '$lib/Logo.svelte';
	import LogoNfz from '$lib/LogoNFZ.svelte';
	export let data;
</script>

<header>
	<input type="checkbox" name="hbr" id="hbr" class="hbr peer" hidden aria-hidden="true" />
	<nav class="navbar peer-checked:navbar-active fixed z-20 w-full bg-white/80 shadow-md shadow-gray-600/5 backdrop-blur md:relative md:bg-transparent dark:bg-gray-900/80 dark:shadow-none">
		<div class="m-auto px-3 xl:container sm:px-6 md:px-12">
			<div class="flex flex-wrap items-center justify-between gap-6 md:gap-0 md:py-3">
				<div class="flex flex-nowrap w-full justify-between lg:w-auto">
					<!-- svelte-ignore a11y-invalid-attribute -->
					<div aria-label="logo" class="flex items-center space-x-2">
						<div aria-hidden="true" class="flex space-x-1">
							<a href="/"><Logo /></a>
						</div>
						<span class="text-base font-bold text-gray-600 dark:text-white">
							<a href="/">PrzyZdunskiej.pl</a> <br>
							<a href="tel:+48544271577" class=" font-semibold text-gray-500 dark:text-gray-100 text-sm">+48 54 4271577</a>
						</span>
					</div>
					<label for="hbr" class="peer-checked:hamburger relative z-20 block cursor-pointer py-6 lg:hidden">
						<div aria-hidden="true" class="m-auto h-0.5 w-6 rounded bg-gray-900 transition duration-300 dark:bg-gray-300"></div>
						<div aria-hidden="true" class="m-auto mt-2 h-0.5 w-6 rounded bg-gray-900 transition duration-300 dark:bg-gray-300"></div>
					</label>
			</div>
				<div class="navmenu lg:float-right lg:ml-auto mb-16 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-7/12 lg:space-y-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
					<div class="text-gray-600 lg:pr-4 dark:text-gray-300">
						<ul class="space-y-6 text-base font-medium tracking-wide lg:flex lg:space-y-0 lg:text-sm">
							{#if !data.hasToken}
							<li>
								<a href="/login" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span>Zaloguj się</span>
								</a>
							</li>
							{:else}
							<li>
								<a href="/app/patient" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span>Panel</span>
								</a>
							</li>
							<!-- <li>
								<a href="/app/changePsw" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span>Zmień hasło</span>
								</a>
							</li> -->
							<li>
								<a href="/logout" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span>Wyloguj się</span>
								</a>
							</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</nav>
<br>
<center><li>
								<a href="/password" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span><p style="color:red;" align="center"><B>Test DNA HPV</B></p></span>
								</a>
							</li></center>
</header>
<div class="m-auto px-2 md:px-3 pt-24 min-h-141 xl:container sm:px-6 lg:px-12 md:pt-6 md:pb-3">
	<div aria-hidden="true" class="absolute inset-0 my-auto h-32 w-96 rotate-45 bg-gradient-to-r from-primaryLight to-secondaryLight opacity-50 blur-3xl dark:opacity-20"></div>
	<slot />
</div>

<footer >
	<svg xmlns="http://www.w3.org/2000/svg" class="-mb-0.5 w-full h" viewBox="0 0 1367.743 181.155">
		<path class="fill-current text-gray-100 dark:text-gray-800" id="wave" data-name="wave" d="M0,0S166.91-56.211,405.877-49.5,715.838,14.48,955.869,26.854,1366,0,1366,0V115H0Z" transform="translate(1.743 66.155)"></path>
	</svg>
	<div class="bg-gradient-to-b from-gray-100 to-transparent pt-1 dark:from-gray-800 dark:to-transparent">
		<div class="container m-auto text-gray-600 dark:text-gray-400">
			<div class="grid grid-cols-8 gap-6 md:gap-0 items-end">
				<div class="col-span-3 border-r border-gray-100 md:col-span-2 lg:col-span-1 dark:border-gray-800">
					<div class="flex items-start justify-between gap-6 border-b border-white py-6 md:block md:space-y-6 md:border-none md:py-0 dark:border-gray-800">
						<div class="flex flex-row items-center gap-1">
							<LogoNfz />
						</div>
					</div>
				</div>
				<div class="col-span-5 text-xs text-gray-500 dark:text-gray-200 text-right border-none md:col-span-6 lg:col-span-7">
					<span>
						NIEPUBLICZNY ZAKŁAD OPIEKI ZDROWOTNEJ PRZYCHODNIA PRZY ZDUŃSKIEJ <br>
						K.LEWANDOWSKA K.WRZESIŃSKA-KRYSZAK SPÓŁKA JAWNA <br>
						NIP8883163169 KRS0001050898 <br>
						UL. ZDUŃSKA 6/12/3, 87-800 WŁOCŁAWEK <br>
						<i>Podmiot Leczniczy numer rejestrowy W04-000000269276</i>
					</span>
				</div>
			</div>
		</div>
	</div>

</footer>
