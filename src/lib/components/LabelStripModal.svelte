<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import { Printer, X, Layers } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let selectedPanelId = $state<string>(panelStore.activePanelId);

  // Keep selectedPanelId in sync if active panel changes
  $effect(() => {
    if (panelStore.panels.some((p) => p.id === panelStore.activePanelId)) {
      selectedPanelId = panelStore.activePanelId;
    }
  });

  const targetPanel = $derived(
    panelStore.panels.find((p) => p.id === selectedPanelId) || panelStore.activePanel
  );

  function triggerPrint() {
    window.print();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-950/60 border border-purple-700/60 rounded-xl text-purple-400">
            <Printer class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-100">
              Printable 18mm Panel Faceplate Label Strips
            </h2>
            <p class="text-xs text-slate-400">
              Print and stick directly onto your consumer unit / distribution board cover.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:purple-500 text-white transition shadow-lg shadow-purple-600/20"
            onclick={triggerPrint}
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Print Labels</span>
          </button>
          <button
            class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition"
            onclick={onClose}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Panel Selector Tabs (if multiple panels exist) -->
      {#if panelStore.panels.length > 1}
        <div class="px-6 py-2.5 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2 print:hidden overflow-x-auto">
          <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <Layers class="w-3.5 h-3.5 text-purple-400" />
            <span>Select Panel:</span>
          </div>
          {#each panelStore.panels as p}
            <button
              class="px-3 py-1 rounded-lg text-xs font-semibold transition {p.id === selectedPanelId ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
              onclick={() => (selectedPanelId = p.id)}
            >
              {p.name}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Preview Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:m-0">
        <div class="bg-amber-950/30 border border-amber-900/40 p-3 rounded-xl text-xs text-amber-300 print:hidden flex items-center justify-between">
          <div>
            <span class="font-bold">Printing Guide for "{targetPanel.name}":</span> Select 100% scale (no fit-to-page scaling) in your print dialog so that each slot matches the true 18mm DIN module pitch.
          </div>
          <span class="text-[11px] font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
            {targetPanel.rows} Rows × {targetPanel.slotsPerRow} Modules
          </span>
        </div>

        {#each Array(targetPanel.rows) as _, r}
          <div class="space-y-1.5">
            <div class="text-xs font-bold text-slate-400 font-mono flex items-center justify-between">
              <span>{targetPanel.name} — DIN Rail Row {r + 1}</span>
              <span class="text-[10px] text-slate-500 font-normal">{targetPanel.slotsPerRow} Slots (18mm each)</span>
            </div>

            <!-- Label Strip Row -->
            <div class="flex border-2 border-slate-600 bg-white rounded overflow-x-auto text-black">
              {#each Array(targetPanel.slotsPerRow) as _, s}
                {@const device = panelStore.devices.find((d) => (d.panelId || panelStore.panels[0].id) === targetPanel.id && d.railIndex === r && d.slotIndex <= s && s < d.slotIndex + d.widthModules)}
                {@const isFirstSlotOfDev = device ? device.slotIndex === s : false}
                {@const def = device ? getDeviceDef(device.typeId) : undefined}

                <div
                  class="w-[68px] h-24 border-r border-slate-300 flex flex-col justify-between p-1 text-center flex-shrink-0 bg-white select-text"
                  title="Slot {s + 1}"
                >
                  {#if device}
                    {#if isFirstSlotOfDev}
                      <div class="text-[9px] font-mono font-bold text-slate-500">
                        Slot {s + 1}{device.widthModules > 1 ? `-${s + device.widthModules}` : ''}
                      </div>

                      <div class="font-bold text-[11px] leading-tight text-slate-900 line-clamp-1">
                        {device.customLabel}
                      </div>

                      <div class="text-[8.5px] font-semibold text-blue-800 font-mono">
                        {device.curve || ''}{device.ratedAmps ? `${device.ratedAmps}A` : ''}
                      </div>

                      <div class="text-[8px] text-slate-600 line-clamp-2 leading-tight">
                        {device.circuitDescription || def?.name}
                      </div>
                    {:else}
                      <!-- Continuation slot of multi-module breaker -->
                      <div class="flex-1 flex items-center justify-center text-slate-300 text-[10px] font-mono">
                        ──
                      </div>
                    {/if}
                  {:else}
                    <div class="text-[9px] font-mono text-slate-400">
                      {s + 1}
                    </div>
                    <div class="flex-1 flex items-center justify-center text-[10px] text-slate-300 italic">
                      SPARE
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
