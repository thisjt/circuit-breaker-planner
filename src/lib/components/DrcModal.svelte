<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { AlertTriangle, CheckCircle2, ShieldAlert, X } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  function selectWarningItem(devId?: string, wireId?: string) {
    if (devId) {
      panelStore.select('device', devId);
      onClose();
    } else if (wireId) {
      panelStore.select('wire', wireId);
      onClose();
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-400">
            <ShieldAlert class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-100">
              Electrical Design Rule Check (DRC)
            </h2>
            <p class="text-xs text-slate-400">
              Automated safety and code compliance diagnostics.
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

      <!-- Warning list -->
      <div class="flex-1 overflow-y-auto p-6 space-y-3">
        {#if panelStore.drcWarnings.length === 0}
          <div class="text-center py-12 flex flex-col items-center gap-3 text-slate-400">
            <CheckCircle2 class="w-12 h-12 text-emerald-400" />
            <div class="text-sm font-bold text-slate-200">No Electrical Design Violations Found</div>
            <p class="text-xs text-slate-500 max-w-sm">
              All rail capacities, wire ampacities, and circuit configurations appear compliant with basic electrical safety rules.
            </p>
          </div>
        {:else}
          {#each panelStore.drcWarnings as warn}
            <div
              class="p-4 rounded-xl border flex items-start justify-between gap-4 transition {warn.level === 'error' ? 'bg-red-950/20 border-red-800/60 text-red-200' : 'bg-amber-950/20 border-amber-800/60 text-amber-200'}"
            >
              <div class="flex items-start gap-3">
                <AlertTriangle class="w-5 h-5 flex-shrink-0 mt-0.5 {warn.level === 'error' ? 'text-red-400' : 'text-amber-400'}" />
                <div>
                  <div class="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[10px] {warn.level === 'error' ? 'bg-red-900/60 text-red-300' : 'bg-amber-900/60 text-amber-300'}">
                      {warn.level}
                    </span>
                    <span>{warn.title}</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    {warn.message}
                  </p>
                </div>
              </div>

              {#if (warn.relatedDeviceIds && warn.relatedDeviceIds.length > 0) || (warn.relatedWireIds && warn.relatedWireIds.length > 0)}
                <button
                  class="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  onclick={() => selectWarningItem(warn.relatedDeviceIds?.[0], warn.relatedWireIds?.[0])}
                >
                  Locate
                </button>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

