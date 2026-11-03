<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import type { PlacedDevice } from '#lib/types';
  import { Download, FileSpreadsheet, X } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let activeTab = $state<'bom' | 'wires'>('bom');

  // Grouped devices for BOM
  const bomRows = $derived(() => {
    const map = new Map<string, {
      name: string;
      category: string;
      width: number;
      amps: string;
      desc: string;
      count: number;
    }>();

    for (const d of panelStore.devices) {
      const def = getDeviceDef(d.typeId);
      const key = `${d.typeId}_${d.ratedAmps || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          name: def?.name || d.customLabel,
          category: def?.category || 'other',
          width: d.widthModules,
          amps: d.ratedAmps ? `${d.ratedAmps}A` : '-',
          desc: d.circuitDescription,
          count: 0
        });
      }
      map.get(key)!.count += 1;
    }

    return Array.from(map.values());
  });

  function downloadBOM() {
    const csv = panelStore.exportBOMCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${panelStore.config.name.toLowerCase().replace(/\s+/g, '_')}_BOM.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadWires() {
    const csv = panelStore.exportWireScheduleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${panelStore.config.name.toLowerCase().replace(/\s+/g, '_')}_wire_schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-400">
            <FileSpreadsheet class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-100">
              Bill of Materials & Schedules
            </h2>
            <p class="text-xs text-slate-400">
              Procurement quantities and panel wiring cut-lists.
            </p>
          </div>
        </div>

        <button
          class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition"
          onclick={onClose}
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Tabs & Actions Bar -->
      <div class="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition {activeTab === 'bom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
            onclick={() => activeTab = 'bom'}
          >
            Bill of Materials ({panelStore.devices.length} Units)
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition {activeTab === 'wires' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
            onclick={() => activeTab = 'wires'}
          >
            Wire Schedule ({panelStore.wires.length} Runs)
          </button>
        </div>

        <div>
          {#if activeTab === 'bom'}
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20"
              onclick={downloadBOM}
            >
              <Download class="w-3.5 h-3.5" />
              <span>Export BOM CSV</span>
            </button>
          {:else}
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20"
              onclick={downloadWires}
            >
              <Download class="w-3.5 h-3.5" />
              <span>Export Wires CSV</span>
            </button>
          {/if}
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if activeTab === 'bom'}
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th class="py-2.5 px-3">Component Name</th>
                <th class="py-2.5 px-3">Category</th>
                <th class="py-2.5 px-3">Width</th>
                <th class="py-2.5 px-3">Rating</th>
                <th class="py-2.5 px-3">Description</th>
                <th class="py-2.5 px-3 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              {#each bomRows() as item}
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="py-2.5 px-3 font-semibold text-slate-100">{item.name}</td>
                  <td class="py-2.5 px-3 uppercase text-[10px] text-slate-400 font-mono">{item.category}</td>
                  <td class="py-2.5 px-3 font-mono text-slate-300">{item.width} TE ({item.width * 18}mm)</td>
                  <td class="py-2.5 px-3 font-mono text-blue-400">{item.amps}</td>
                  <td class="py-2.5 px-3 text-slate-400">{item.desc || '-'}</td>
                  <td class="py-2.5 px-3 text-right font-bold text-slate-100">{item.count}</td>
                </tr>
              {/each}
              {#if bomRows().length === 0}
                <tr>
                  <td colspan="6" class="text-center py-8 text-slate-500">
                    No components placed in enclosure.
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        {:else}
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th class="py-2.5 px-3">Wire</th>
                <th class="py-2.5 px-3">From</th>
                <th class="py-2.5 px-3">To</th>
                <th class="py-2.5 px-3">Role</th>
                <th class="py-2.5 px-3">Gauge</th>
                <th class="py-2.5 px-3">Color</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              {#each panelStore.wires as wire}
                {@const srcDev = panelStore.devices.find((d: PlacedDevice) => d.id === wire.sourceDeviceId)}
                {@const tgtDev = panelStore.devices.find((d: PlacedDevice) => d.id === wire.targetDeviceId)}
                <tr class="hover:bg-slate-800/40 transition font-mono">
                  <td class="py-2.5 px-3 text-slate-400 text-[10px]">{wire.id}</td>
                  <td class="py-2.5 px-3">
                    <span class="text-blue-400 font-bold">{srcDev?.customLabel || wire.sourceDeviceId}</span>
                    <span class="text-slate-500"> ({wire.sourceTerminalId})</span>
                  </td>
                  <td class="py-2.5 px-3">
                    <span class="text-emerald-400 font-bold">{tgtDev?.customLabel || wire.targetDeviceId}</span>
                    <span class="text-slate-500"> ({wire.targetTerminalId})</span>
                  </td>
                  <td class="py-2.5 px-3 uppercase text-[10px] text-slate-300">{wire.role}</td>
                  <td class="py-2.5 px-3 text-amber-400 font-bold">{wire.gaugeMetric} mm²</td>
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-1.5">
                      <div class="w-3 h-3 rounded-full border border-slate-700" style="background-color: {wire.color};"></div>
                      <span class="text-[10px] text-slate-400">{wire.color}</span>
                    </div>
                  </td>
                </tr>
              {/each}
              {#if panelStore.wires.length === 0}
                <tr>
                  <td colspan="6" class="text-center py-8 text-slate-500">
                    No wire runs routed yet.
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </div>
{/if}

