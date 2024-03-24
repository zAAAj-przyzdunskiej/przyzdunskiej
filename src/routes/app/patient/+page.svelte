<script lang="ts">
	import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables/remote';
	import { DateInput } from 'date-picker-svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { dateToStr} from '$lib/utils'
	type Visit = {date: string, timeFrom: string, timeTo: string, [key: string] : any};

	let freeSlots: any = [];
	let handler = new DataHandler(freeSlots, { rowsPerPage: 50 });
	handler.onChange(() => reloadSlots());

	const upcomingVisits = writable([] as Visit[]);
	const pastVisits = writable([] as Visit[]);
	const today = new Date();
	let dateVal:Date|null = null;
	let sTimeFrame = "";
	let interview = "";
	let examination = "";

	const reloadSlots = async () => {
        if(dateVal === null) {
            return [];
        }
		let visitDate: string = dateToStr(dateVal);
		//alert(visitDate);
		const response = await fetch('/app/patient/visits/slots?visitDate=' + visitDate);
		const resObj = await response.json();
		freeSlots = resObj.slots;
		return freeSlots;
	};
	const reloadVisits = async () => {
		const response = await fetch('/app/patient/visits/');
		const resObj = await response.json();
		if (resObj.success) {
			upcomingVisits.set(resObj.upcomingVisits);
			pastVisits.set(resObj.pastVisits);
		} else {
			alert(resObj.message);
		}
	};

	const rows = handler.getRows();
	const selectedRows = handler.getSelected();
	
	export function compareVisit(lVisit: Visit, rVisit: Visit): number {
		let right = rVisit.date, left = lVisit.date;
		if(right == left) {
			right = rVisit.timeFrom || "24:00";
			left = lVisit.timeFrom || "24:00";
		}
		if(left < right) {
			return -1;
		} else if(right == left) {
			return 0;
		} else {
			return 1;
		}
	}	
	const submitNewVisit = async () => {
		if(dateVal == null || $selectedRows.length === 0){
			alert("Proszę wybrać dzień spotkania");
			return;
		} 

		const slot = $selectedRows[0];
		const visit: Visit = {
			doctor: slot.doctor,
			office: slot.office,
			date: slot.date,
			timeFrom: slot.start,
			timeTo: slot.end,
			visit_kind: slot.visit_kind, 
			examination: examination,
			interview: interview
		}
		let cfgReq = {
            method: "POST",
            body: JSON.stringify(visit)
        };
		dateVal = null;
		handler.invalidate();
        let response = await fetch('/app/patient/visits/create', cfgReq);
		const resObj = await response.json();
		if (resObj.success) {
			if(resObj.visit) {
				const resVisit = resObj.visit as Visit;
				upcomingVisits.update(visits => {
					const lastIdx = visits.length - 1
					let index = lastIdx;
					for(; index >= 0 && compareVisit(visits[index], resVisit) > 0; index--);
					if(index == lastIdx) {
						visits.push(resVisit);
					} else {
						visits.splice(index + 1, 0, resVisit);
					}
					return visits;
				});
				//console.log("Updated upcoming visits");
			} else {
				alert("New visit object is not returned");
			}
			dateVal = null;
			sTimeFrame = "";
			handler.invalidate();
		} else {
			alert("Nie udało się umówić na spotkanie:: " + resObj.message);
		}
	}

	onMount(() => {
		reloadVisits();
		handler.invalidate();
	});
</script>

<section class="body-font text-gray-600">
	<div class="container mx-0 flex flex-wrap items-start md:px-5 py-2 md:py-8">
		<div class="pr-0 md:w-1/2 md:pr-4 lg:w-3/5 lg:pr-0">
			<div class="container md:px-5 pt-9 pb-6">
				<div class="-my-8 pl-5">
                    <h2 class="text-gray-900 dark:text-gray-100 text-lg font-medium title-font border-b-2 border-gray-600 dark:border-gray-200">Nadchodząca wizyta</h2>
{#if $upcomingVisits.length == 0}
                    <div class="flex flex-wrap md:flex-nowrap text-sm text-gray-600 dark:text-gray-300">żadnych wizyt</div>
{:else}
	{#each $upcomingVisits as visit}
					<div class="flex flex-wrap md:flex-nowrap border-b border-gray-600">
						<div class="flex flex-shrink-0 flex-col md:w-48 sm:max-w-">
							<span class="font-semibold text-sm text-gray-700 dark:text-gray-100">{visit.date}</span>
							<span class="mt-1 text-sm text-gray-500 dark:text-gray-200">{visit.timeFrom} - {visit.timeTo}</span>
						</div>
						<div class="max-w-2/3 sm:max-w-4/5 md:flex-grow pl-4 md:pl-6">
							<span class="font-semibold text-sm text-gray-700 dark:text-gray-100">{visit.doctor}</span>
							<p class="leading-relaxed">Status: {visit.state}</p>
						</div>
					</div>
	{/each}
{/if}
                    <h2 class="text-gray-900 dark:text-gray-100 text-lg font-medium title-font mt-3 border-b-2 border-gray-600 dark:border-gray-200">Poprzednie wizyty</h2>
{#each $pastVisits as visit}
                    <div class="flex flex-wrap md:flex-nowrap border-b border-gray-600">
						<div class="mb-3 flex flex-shrink-0 flex-col md:mb-0 md:w-48">
							<span class="font-semibold text-sm text-gray-700 dark:text-gray-100">{visit.date}</span>
							<span class="mt-1 text-sm text-gray-500 dark:text-gray-200">{visit.timeFrom} - {visit.timeTo}</span>
						</div>
						<div class="max-w-2/3 sm:max-w-4/5 md:flex-grow pl-4 md:pl-6">
							<span class="font-semibold text-sm text-gray-700 dark:text-gray-100">{visit.doctor}</span>
    {#if visit.examination}
							<p class="leading-relaxed text-gray-500 dark:text-gray-200">{visit.examination}</p>
    {/if}
    {#if visit.recognition_description}
							<p class="leading-relaxed text-gray-500 dark:text-gray-200">{visit.recognition_description}</p>
    {/if}
    {#if visit.recommendation}
							<p class="leading-relaxed text-gray-500 dark:text-gray-200">{visit.recommendation}</p>
    {/if}
						</div>
					</div>
{/each}
				</div>
			</div>
		</div>
		<div class="flex w-full flex-col rounded-lg bg-gray-100 p-4 mt-6 md:mt-2 border border-primary/10 shadow-md md:w-1/2 lg:w-2/5">
            <h2 class="text-gray-900 text-lg font-medium title-font mb-2">Umówić się</h2>
			<label for="examination" class="leading-7 text-sm text-gray-600">Badanie</label>
			<textarea maxlength="1000" value="{examination}" id="examination" name="examination" rows="3"
				placeholder="Proszę podaj na jakie leki potrzebujsz receptę w każdym przypadku wyszczególnij: &#13;&#10; nazwę zażywanego leku, dawkę, ile opakowań"
				class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
			<label for="interview" class="leading-7 text-sm text-gray-600">Powody wizyty</label>
			<textarea maxlength="1000" rows="3" placeholder="Opisz w kilku zdaniach swój problem zdrowotny. &#13;&#10; Jakie masz dolegliwości? &#13;&#10; Co potrzebujesz?" value="{interview}" id="interview" name="interview" class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
			<div class="w-full flex-row align-top items-stretch flow-root mt-5">
                <DateInput placeholder="Wybierz datę" bind:value={dateVal} closeOnSelection={true} min={today} format="yyyy-MM-dd" on:select={(_) => handler.invalidate()} 
                    class="border border-transparent w-24 rounded-lg bg-white float-left"/>
                <input readonly={true} value="{sTimeFrame}" class="w-28 ml-5 mt-px border-none h-9 p-1 rounded-s-sm bg-transparent text-black float-left">
                <button on:click={(_) => submitNewVisit()} class="text-white bg-blue-500 border-0 py-1 px-1 focus:outline-none hover:bg-primary rounded float-right">Składać</button>
            </div>
            <div class="w-full align-top">
                <Datatable class="max-h-72 w-full overflow-y-scroll" {handler} search={false} rowsPerPage={false} pagination={false}>
                    <table>
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
                                <tr class:active={$selectedRows.includes(row)}>
                                    <td class="selection">
                                        <input
                                            type="checkbox"
                                            name="slot"
                                            on:click={() => {
                                                handler.getSelected().set([]);
                                                handler.select(row);
												sTimeFrame = row.start + " - " + row.end;
                                            }}
                                            checked={$selectedRows.includes(row)} />
                                    </td>
                                    <td class="items-center">{@html row.start}</td>
                                    <td class="items-center">{@html row.end}</td>
                                    <td>{@html row.doctorName}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </Datatable>
                            </div>
        </div>
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
