<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import { Printer, X } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

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
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/20"
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

      <!-- Preview Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:m-0">
        <div class="bg-amber-950/30 border border-amber-900/40 p-3 rounded-xl text-xs text-amber-300 print:hidden">
          <span class="font-bold">Printing Guide:</span> Select 100% scale (no fit-to-page scaling) in your print dialog so that each slot matches the true 18mm DIN module pitch.
        </div>

        {#each Array(panelStore.config.rows) as _, r}
          <div class="space-y-1.5">
            <div class="text-xs font-bold text-slate-400 font-mono">
              DIN Rail Row {r + 1}
            </div>

            <!-- Label Strip Row -->
            <div class="flex border-2 border-slate-600 bg-white rounded overflow-x-auto text-black">
              {#each Array(panelStore.config.slotsPerRow) as _, s}
                {@const device = panelStore.devices.find((d) => d.railIndex === r && d.slotIndex <= s && s < d.slotIndex + d.widthModules)}
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

