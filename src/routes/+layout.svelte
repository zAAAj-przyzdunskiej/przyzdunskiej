<script>
	import '../app.pcss';
	import Logo from '$lib/Logo.svelte';
</script>

<header>
	<input type="checkbox" name="hbr" id="hbr" class="hbr peer" hidden aria-hidden="true" />
	<nav class="bg-white/80 dark:bg-gray-900/80 navbar shadow-gray-600/5 peer-checked:navbar-active md:bg-transparent fixed z-20 w-full shadow-md backdrop-blur md:relative dark:shadow-none">
		<div class="m-auto px-6 xl:container md:px-12">
			<div class="flex flex-wrap items-center justify-between gap-6 md:gap-0 md:py-3">
				<div class="flex w-full justify-between lg:w-auto">
					<!-- svelte-ignore a11y-invalid-attribute -->
					<a href="#top" aria-label="logo" class="flex items-center space-x-2">
						<div aria-hidden="true" class="flex space-x-1">
							<Logo />
						</div>
						<span class="text-gray-600 dark:text-white text-base font-bold">PRZYzduńskiej</span>
					</a>
					<label for="hbr" class="peer-checked:hamburger relative z-20 -mr-6 block cursor-pointer p-6 lg:hidden">
						<div aria-hidden="true" class="bg-gray-900 dark:bg-gray-300 m-auto h-0.5 w-6 rounded transition duration-300"></div>
						<div aria-hidden="true" class="bg-gray-900 dark:bg-gray-300 m-auto mt-2 h-0.5 w-6 rounded transition duration-300" ></div>
					</label>
				</div>
				<div class="navmenu border-gray-100 shadow-gray-300/20 bg-white dark:bg-gray-800 lg:bg-transparent dark:border-gray-700 mb-16 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-7/12 lg:space-y-0 lg:border-0 lg:p-0 lg:shadow-none dark:shadow-none" >
					<div class="text-gray-600 dark:text-gray-300 lg:pr-4">
						<ul class="space-y-6 text-base font-medium tracking-wide lg:flex lg:space-y-0 lg:text-sm" >
							<li>
								<a href="#top" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span>Portfolio</span>
								</a>
							</li>
							<li>
								<a href="#top" class="block transition hover:text-primary md:px-4 dark:hover:text-primaryLight">
									<span>Services</span>
								</a>
							</li>
						</ul>
					</div>

					<div class="dark:border-gray-700 -ml-1 flex w-full flex-col space-y-2 border-primary/10 sm:flex-row md:w-max lg:space-y-0 lg:border-l">
						<a href="#top" class="relative ml-auto flex h-9 items-center justify-center before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:px-6 dark:before:bg-primaryLight">
							<span class="text-white dark:text-gray-900 relative text-sm font-semibold">Login</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</nav>
</header>
<div class="m-auto px-6 pt-32 xl:container md:px-12 md:py-12">
	<div aria-hidden="true" class="absolute inset-0 my-auto h-32 w-96 rotate-45 bg-gradient-to-r from-primaryLight to-secondaryLight opacity-50 blur-3xl dark:opacity-20"></div>
	<slot />
</div>

<footer>
	<svg xmlns="http://www.w3.org/2000/svg" class="-mb-0.5 w-full" viewBox="0 0 1367.743 181.155">
		<path class="fill-current text-gray-100 dark:text-gray-800" id="wave" data-name="wave" d="M0,0S166.91-56.211,405.877-49.5,715.838,14.48,955.869,26.854,1366,0,1366,0V115H0Z"
			transform="translate(1.743 66.155)"></path>
	</svg>
	<div class="from-gray-100 to-transparent dark:from-gray-800 dark:to-transparent bg-gradient-to-b pt-1" >
		<div class="text-gray-600 dark:text-gray-400 container m-auto space-y-8 px-6 md:px-12 lg:px-20">
			<div class="grid grid-cols-8 gap-6 md:gap-0">
				<div class="border-gray-100 dark:border-gray-800 col-span-8 border-r md:col-span-2 lg:col-span-3" >
					<div class="border-white dark:border-gray-800 flex items-center justify-between gap-6 border-b py-6 md:block md:space-y-6 md:border-none md:py-0" >
                        <div class="flex gap-1 flex-row items-center">
						    <Logo /> 
                            <span class="text-gray-600 items-bottom dark:text-white text-2xl font-bold">PrzyZduńskiej</span>
                        </div>
						<div class="flex gap-6"> 
							<a href="#top" target="blank" aria-label="github" class="hover:text-cyan-600">
								<svg width="20" height="20" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
									/>
								</svg>
							</a>
							<a href="#top" target="blank" aria-label="twitter" class="hover:text-cyan-600">
								<svg width="20" height="20" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"
									/>
								</svg>
							</a>
							<a href="#top" target="blank" aria-label="medium" class="hover:text-cyan-600">
								<svg width="20" height="20" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M9.025 8c0 2.485-2.02 4.5-4.513 4.5A4.506 4.506 0 0 1 0 8c0-2.486 2.02-4.5 4.512-4.5A4.506 4.506 0 0 1 9.025 8zm4.95 0c0 2.34-1.01 4.236-2.256 4.236-1.246 0-2.256-1.897-2.256-4.236 0-2.34 1.01-4.236 2.256-4.236 1.246 0 2.256 1.897 2.256 4.236zM16 8c0 2.096-.355 3.795-.794 3.795-.438 0-.793-1.7-.793-3.795 0-2.096.355-3.795.794-3.795.438 0 .793 1.699.793 3.795z"
									/>
								</svg>
							</a>
						</div>
					</div>
				</div>
				<div class="col-span-8 md:col-span-6 lg:col-span-5">
					<div class="grid grid-cols-2 gap-6 pb-16 sm:grid-cols-3 md:pl-16">
						<div>
							<h6 class="text-gray-800 dark:text-gray-200 text-lg font-medium">Company</h6>
							<ul class="mt-4 list-inside space-y-4">
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Portfolio</a>
								</li>
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Services</a>
								</li>
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Contact us</a>
								</li>
							</ul>
						</div>
						<div>
							<h6 class="text-gray-800 dark:text-gray-200 text-lg font-medium">Resources</h6>
							<ul class="mt-4 list-inside space-y-4">
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Guides</a>
								</li>
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Blogs</a>
								</li>
							</ul>
						</div>
						<div>
							<h6 class="text-gray-800 dark:text-gray-200 text-lg font-medium">Contact us</h6>
							<ul class="mt-4 list-inside space-y-4">
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Address</a>
								</li>
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Register</a>
								</li>
								<li>
									<a href="#top" class="hover:text-cyan-600 transition">Jobs</a>
								</li>
							</ul>
						</div>
					</div>
					<div class="border-gray-100 dark:border-gray-800 flex justify-between border-t py-4 pb-8 md:pl-16">
						<span>&copy; PRZYzduńskiej <span id="year"></span> </span>
						<span>Powered by Sauros Ltd.</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
