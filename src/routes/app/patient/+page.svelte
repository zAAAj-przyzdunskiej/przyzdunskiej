<script lang="ts">
	import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables/remote';
	import { DateInput } from 'date-picker-svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { compareVisit, dateToStr, type VisitTime } from '$lib/utils';
	import { PUBLIC_VISIT_APPOINTED } from '$env/static/public';

	export let data;
	let freeSlots: any = [];
	let handler = new DataHandler(freeSlots, { rowsPerPage: 50 });
	handler.onChange(() => reloadSlots());

	const isLoading = writable(false);
	const upcomingVisits = writable(data.upommingVisits as VisitTime[]);
	//	const pastVisits = writable([] as VisitTime[]);
	const today = new Date();
	const isWomen = data.isWomen || false;
	const maxDate = new Date(new Date().setFullYear(today.getFullYear() + 1));

	const qas = [
		// {
		// 	q: 'Jakiego rodzaju wizyty chcesz?',
		// 	a: 'Lekarz rodzinny',
		// 	hint: '',
		// 	required: true,
		// 	applicable: isWomen,
		// 	options: ['Lekarz rodzinny', 'Ginekolog']
		// },
		{
			q: 'Opisz w kilku zdaniach swój problem zdrowotny.',
			a: null,
			hint: 'Jakie masz dolegliwości? Co potrzebujesz?',
			required: true,
			applicable: true,
			numLines: 3
		},
		{
			q: 'Proszę podaj na jakie leki potrzebujsz receptę w każdym przypadku wyszczególnij:',
			a: null,
			hint: 'Nazwa leku, dawka, jak często, ilość opak',
			required: false,
			applicable: true,
			numLines: 3
		},
		{
			q: 'Choroby przewlekłe:',
			a: null,
			hint: 'wymień jeżeli chorujesz ',
			required: false,
			applicable: true,
			numLines: 1
		},
		{
			q: 'Operacje ginekologiczne:',
			a: null,
			hint: 'wymień krótko przebyte zabiegi ',
			required: false,
			applicable: isWomen,
			numLines: 1
		},
		{
			q: 'Pierwszy dzień ostatniej miesiączki (data kiedy się zaczeła)',
			a: null,
			hint: 'MM-DD-YYYY',
			required: false,
			applicable: isWomen,
			numLines: 1,
			dateFormat: 'MM-dd-yyyy'
		},
		{
			q: 'Czy palisz papierosy? Tradycyjne? Jak dużo dziennie?',
			a: 'Nie palę!',
			hint: ' ',
			required: true,
			applicable: true,
			options: ['Nie palę!', '< 10 sztuk na dzień ', '> 10 sztuk na dzień']
		},
		{
			q: 'Przybliżona waga ciała w kg',
			a: null,
			hint: ' ',
			required: true,
			applicable: true
		},
		{
			q: 'Przybliżony wzrost w cm',
			a: null,
			hint: ' ',
			required: true,
			applicable: true
		}
	];

	let officeId = "58155";
	const storeOfficeId = writable(officeId);
	storeOfficeId.subscribe((value) => { 
		//alert(officeId + " --> " + value);
		if(officeId != value) { 
			officeId = value; 
			handler.invalidate();
		}
	});
	let dateVal: Date | null = null;
	let initial = true;

	const reloadSlots = async () => {
		if (dateVal === null) {
			//alert("dateVal is null")
			return [];
		}
		let visitDate: string = dateToStr(dateVal);
		//alert(visitDate);
		//alert("requesting server for slots" + '/app/patient/visits/slots?ajax=true&visitDate=' + visitDate + "&office=" + officeId)
		const response = await fetch('/app/patient/visits/slots?ajax=true&visitDate=' + visitDate + "&office=" + officeId);
		const resObj = await response.json();
		if(!resObj.success) {
			alert(resObj.message);
			return [];
		}
		freeSlots = resObj.slots;
		return freeSlots;
	};
	// const reloadVisits = async () => {
	// 	const response = await fetch('/app/patient/visits/');
	// 	const resObj = await response.json();
	// 	if (resObj.success) {
	// 		upcomingVisits.set(resObj.upcomingVisits);
	// 		pastVisits.set(resObj.pastVisits);
	// 	} else {
	// 		alert(resObj.message);
	// 	}
	// };

	const rows = handler.getRows();
	const selectedRows = handler.getSelected();
	function numberValidator(node: any, value: any) {
		return {
			update(value: string | number | null) {
				node.value = value === null || value < node.min ? node.value : (typeof value == "number" ? value : parseFloat(value));
			}
		};
	};

	const cancelVisit = async (visitId: string) => {
		let confirmed = confirm('Czy na pewno chcesz anulować tę wizytę?');
		if (!confirmed) return;
		let response = await fetch('/app/patient/visits/cancel/' + visitId );
		const resObj = await response.json();
		if(resObj.success) {
			upcomingVisits.set([]);
		} else {
			alert(resObj.message);
		}
	};
	const submitNewVisit = async () => {
		initial = false;

		let interview = '';
		let missingMandatory = false
		for (let i = 0; i < qas.length; i++) {
			interview = interview + ' ++ ' + qas[i].q + '\n -- ' + (qas[i].a || '') + '\n';
			if(!missingMandatory && qas[i].required && (!qas[i].a || qas[i].a == '')) {
				missingMandatory = true
			}
		}
		if (missingMandatory) {
			alert('Proszę wypełnić wszystkie wymagane pola.');
			return;
		}
		if (dateVal == null || $selectedRows.length === 0) {
			alert('Proszę wybrać datę i godzinę wizyty');
			return;
		}
		//alert(interview);

		const slot = $selectedRows[0];
		const visit: VisitTime = {
			doctor: slot.doctor,
			office: slot.office,
			date: slot.date,
			timeFrom: slot.start,
			timeTo: slot.end,
			visit_kind: slot.visit_kind,
			interview: interview
		};
		let cfgReq = {
			method: 'POST',
			body: JSON.stringify(visit)
		};
		isLoading.set(true);
		// dateVal = null;
		// handler.invalidate();
		let response = await fetch('/app/patient/visits/create', cfgReq);
		const resObj = await response.json();
		if (resObj.success) {
			if (resObj.visit) {
				const resVisit = resObj.visit as VisitTime;
				upcomingVisits.update((visits) => {
					const lastIdx = visits.length - 1;
					let index = lastIdx;
					for (; index >= 0 && compareVisit(visits[index], resVisit) > 0; index--);
					if (index == lastIdx) {
						visits.push(resVisit);
					} else {
						visits.splice(index + 1, 0, resVisit);
					}
					alert(PUBLIC_VISIT_APPOINTED);
					return visits;
				});
				//console.log("Updated upcoming visits");
			} else {
				alert('New visit object is not returned');
			}
			dateVal = null;
			//handler.invalidate();
		} else {
			alert('Nie udało się umówić na spotkanie:: ' + resObj.message);
		}
		isLoading.set(false);
	};

	onMount(() => {
		//reloadVisits();
		handler.invalidate();
	});
</script>

<section class="body-font text-gray-600">
	<div class="container mx-0 flex flex-wrap items-start py-2 md:py-8 md:pl-5">
		{#if $upcomingVisits.length > 0}
		<div class="w-full pr-0">
			<div class="container pt-9">
				<div class="-my-8 px-3">
					<h2 class="title-font border-b-2 border-gray-600 text-lg font-medium text-gray-900 dark:border-gray-200 dark:text-gray-100">
						Nadchodząca wizyta <i class=" font-light text-sm">(Jeżeli chcesz zmienić rezerwację ANULUJ poprzednią wizytę)</i>
					</h2>
						{#each $upcomingVisits as visit}
					<div class="flex flex-nowrap border-b border-gray-600 md:flex-nowrap">
						<div class="flex flex-shrink-0 flex-col sm:max-w-1/3 md:w-48">
							<span class="text-sm font-semibold text-gray-700 dark:text-gray-100">{visit.date}</span>
							<span class="mt-1 text-sm text-gray-500 dark:text-gray-200">{visit.timeFrom} - {visit.timeTo}</span>
						</div>
						<div class="w-full md:flex-grow pl-4 md:pl-6">
							<span class="text-sm font-semibold text-gray-700 dark:text-gray-100">{visit.doctor}</span>
							<div class="flex w-full flex-nowrap items-stretch">
								<p class="leading-relaxed">Status: {visit.state}</p>
								<button
									on:click={(_) => {
										cancelVisit(visit.id);
									}}
									class="ml-auto -mt-1 mb-1 align-top rounded border-0 bg-blue-500 px-1 py-1 text-white hover:bg-primary focus:outline-none">Anulować</button>
							</div>
						</div>
					</div>
						{/each}
					<!-- {:else}
						<div class="flex flex-nowrap border-b border-gray-600 md:flex-nowrap">
							<div class="flex flex-shrink-0 flex-col sm:max-w-1/3 md:w-48">
								<span class="text-sm font-semibold text-gray-700 dark:text-gray-100">Żadnych wizyt</span>
							</div>
							<button class="ml-auto rounded border-0 bg-blue-500 px-1 py-1 text-white hover:bg-primary focus:outline-none">Nową wizytę</button>
						</div> -->
				</div>
			</div>
			<!-- <div class="container px-3 pt-9 pb-6">
				<span class="text-pretty text-lg text-gray-900 dark:text-gray-100">Masz zarezerwowną wizytę u lekarza.
					Jeżeli chcesz zmienić rezerwację ANULUJ poprzednią wizytę</span>
			</div> -->
		</div>
		{/if}
		{#if $upcomingVisits.length == 0}
			<div class="mt-5 w-full rounded-lg border border-primary/10 bg-gray-100 py-5 pr-0 text-sm text-gray-800 shadow-md">
				<h2 class="title-font mb-2 px-3 text-lg font-medium text-gray-900">Wypełnij formularz teleporady </h2>&nbsp; &nbsp; &nbsp;<h3>Wizyty osobiste wymagają <u>kontaktu telefonicznego</u> z rejestracją. </h3><br>
				<div class="flex w-full flex-wrap items-stretch">
					<div class="w-full flex-row px-3 md:w-1/2">
						{#if isWomen}
						<div class="flex flex-row flex-wrap w-full">
							<label for="office" class="text-sm leading-7 text-gray-600">Jakiego rodzaju wizyty potrzebujesz?</label>
							<ul class="pl-3">
								<li>
									<input type="radio" bind:group={$storeOfficeId} name="office" id="office1" value="58155" checked/>
									<label for="office1" class="text-sm leading-7 text-gray-600">Lekarz rodzinny</label>
								</li>
								<li>
									<input type="radio" bind:group={$storeOfficeId} name="office" id="office2" value="59881"/>
									<label for="office2" class="text-sm leading-7 text-gray-600">Ginekolog</label>
								</li>
							</ul>
						</div>
						{/if}
					{#each qas as qa, i}
						{#if qa.applicable}
							<input type="hidden" name="q{i}" value={qa.q} />
							{#if qa.options}
								<div class="ex flex-row flex-wrap w-full">
									<label for="a{i}" class="text-sm leading-7 text-gray-600">{qa.q}</label>
									<ul class="pl-3">
										{#each qa.options as opt, j}
											<li>
												<input type="radio" bind:group={qa.a} name="a{i}" id="a{i}{j}" value={opt} required={qa.required} class="invalid:[&:not({initial}):not(:focus)]:border-red-500"/>
												<label for="a{i}{j}" class="text-sm leading-7 text-gray-600">{opt}</label>
											</li>
										{/each}
									</ul>
								</div>
							{:else if qa.dateFormat}
								<div class="flex w-full flex-row flex-nowrap">
									<label for="a{i}" class="text-sm leading-7 text-gray-600">{qa.q}</label>
									<DateInput id="a{i}" bind:value={qa.a} placeholder={qa.hint} required={qa.required} closeOnSelection={true} max={today} format={qa.dateFormat} class="float-left ml-auto mr-3 w-24 h-8 flex-row rounded border border-transparent bg-white" />
								</div>
							{:else if !qa.numLines}
								<div class="flex w-full flex-row flex-nowrap">
									<label for="a{i}" class="text-sm leading-7 text-gray-600">{qa.q}</label>
									<input type="number" use:numberValidator={qa.a} bind:value={qa.a} required={qa.required} class="mt-1 w-24  ml-auto rounded border border-gray-300 bg-white invalid:[&:not({initial}):not(:focus)]:border-red-500" />
								</div>
							{:else}
								<label for="a{i}" class="text-sm leading-7 text-gray-600">{qa.q}</label>
								<textarea bind:value={qa.a} maxlength="1000" required={qa.required} id="a{i}" name="a{i}" rows={qa.numLines} placeholder={qa.hint} class="w-full rounded border border-gray-300 bg-white px-3 py-1 text-base leading-8 text-gray-700 outline-none transition-colors duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-200 invalid:[&:not({initial}):not(:focus)]:border-red-500" />
							{/if}
						{/if}
					{/each}
					</div>
					<div class="w-full px-3 md:w-1/2">
						<div class="flex flex-row flex-nowrap w-full">
							<label for="visitDate" class="flex-row text-sm leading-7 text-gray-600">Wybierz datę wizyty: </label>
							<DateInput id="visitDate" required placeholder="Wybierz datę" bind:value={dateVal} closeOnSelection={true} min={today} max={maxDate} format="yyyy-MM-dd" on:select={(_) => {handler.invalidate()}} class="ml-auto mr-3 w-24 h-8 rounded border border-transparent bg-white invalid:[&:not({initial}):not(:focus)]:border-red-500" />
						</div>
						<div class="w-full align-top">
							<label for="visitTime" class="text-sm leading-7 text-gray-600">Wybierz godzinę wizyty:</label>
							<Datatable name="visitTime" id="visitTime" class="max-h-136 w-full overflow-y-scroll text-gray-800" {handler} search={false} rowsPerPage={false} pagination={false}>
								<table class="rounded border border-gray-300 text-gray-800">
									<thead class="bg-white">
										<tr class=" sticky top-0 z-50">
											<th class=" w-8 border-b border-solid border-b-gray-100 pl-2"> </th>
											<Th {handler} orderBy="start" class="w-10">OD</Th>
											<Th {handler} orderBy="end" class="w-10">DO</Th>
											<Th {handler} orderBy="doctorName" class="w-80">Lekarz</Th>
										</tr>
										<tr>
											<th class="selection" />
											<ThFilter {handler} filterBy="start" />
											<ThFilter {handler} filterBy="end" />
											<ThFilter {handler} filterBy="doctorName" />
										</tr>
									</thead>
									<tbody>
										{#each $rows as row}
											<tr class:active={$selectedRows.includes(row)} on:click={(e) => {
												let isAlreadyChecked = $selectedRows.includes(row);
												handler.clearSelection();
												selectedRows.set([]);
												if(!isAlreadyChecked) {
													handler.select(row);
												}
											}}>
												<td class="selection">
													<input
														type="checkbox"
														name="slot"
														checked={$selectedRows.includes(row)} />
												</td>
												<td class="items-center">{@html row.start}</td>
												<td class="items-center">{@html row.end}</td>
												<td class="">{@html row.doctorName}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</Datatable>
						</div>
						<div class="mt-3 w-full align-middle">
							<button on:click={submitNewVisit} disabled={$isLoading} class="float-right rounded border-0 bg-blue-500 px-1 py-1 text-white hover:bg-primary focus:outline-none">
								{#if $isLoading}
									<div role="status" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
									<span>Ładowanie...</span>
								{:else}
									<span>Zatwierdź wizytę</span>
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	thead {
		background: #fff;
	}
	thead th.selection {
		padding-left: 5px;
		border-bottom: 1px solid #e0e0e0;
		align-items: center;
	}
	tbody {
		background: #fff;
	}
	tbody td {
		border: 1px solid #f5f5f5;
		padding-left: 8px;
		padding-right: 4px;
	}
	tbody tr {
		transition: all, 0.2s;
	}
	tbody tr:hover {
		background: #f5f5f5;
	}
	tbody tr.active {
		background: var(--primary-lighten-1);
	}
	tbody tr.active:hover {
		background: var(--primary-lighten-2);
	}
	td :global(b) {
		font-weight: normal;
		color: #bdbdbd;
		font-family: JetBrains;
		font-size: 11px;
	}
	td.selection {
		align-items: center;
	}
	:global(body) {
		--date-input-width: 106px;
	}
</style>
