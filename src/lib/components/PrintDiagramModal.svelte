<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { Printer, X } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    getSerializedDiagramSvg: () => { svgMarkup: string; width: number; height: number } | null;
  }

  let { isOpen, onClose, getSerializedDiagramSvg }: Props = $props();

  let previewData = $state<{ svgMarkup: string; width: number; height: number } | null>(null);

  $effect(() => {
    if (isOpen) {
      previewData = getSerializedDiagramSvg();
    }
  });

  function handlePrintSheet() {
    const diagram = previewData || getSerializedDiagramSvg();
    if (!diagram) return;

    const printWin = window.open('', '_blank', 'width=1200,height=850');
    if (!printWin) {
      window.print();
      return;
    }

    const title = panelStore.projectTitle || panelStore.activePanel.name || 'Electrical Panel Plan';
    const author = panelStore.projectAuthor || '—';
    const sharePath = panelStore.cloudPlanId
      ? `${window.location.origin}/plan/${panelStore.cloudPlanId}`
      : 'Local Workspace';
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} — Electrical Diagram Print Sheet</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #ffffff;
      color: #0f172a;
    }
    .sheet {
      border: 2px solid #0f172a;
      display: flex;
      flex-direction: column;
      min-height: 92vh;
    }
    .canvas-area {
      flex: 1;
      background: #020617;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      overflow: hidden;
    }
    .canvas-area svg {
      max-width: 100%;
      max-height: 74vh;
      width: auto;
      height: auto;
    }
    .title-block {
      border-top: 2px solid #0f172a;
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr 1.4fr;
      font-size: 11px;
      background: #f8fafc;
    }
    .cell {
      padding: 8px 12px;
      border-right: 1px solid #cbd5e1;
    }
    .cell:last-child { border-right: none; }
    .label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .val {
      font-weight: 700;
      color: #0f172a;
      font-size: 12px;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="canvas-area">
      ${diagram.svgMarkup}
    </div>
    <div class="title-block">
      <div class="cell">
        <div class="label">Project / Schedule Title</div>
        <div class="val">${title}</div>
      </div>
      <div class="cell">
        <div class="label">Prepared By (Electrical Engineer)</div>
        <div class="val">${author}</div>
      </div>
      <div class="cell">
        <div class="label">System Summary & Standard</div>
        <div class="val mono">${panelStore.panels.length} Panel(s) • ${panelStore.devices.length} Breakers • ${panelStore.activePanel.wireStandard}</div>
      </div>
      <div class="cell">
        <div class="label">Date / Cloud Reference</div>
        <div class="val mono">${dateStr} • ${sharePath}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 250);
    };
  <\/script>
</body>
</html>`);
    printWin.document.close();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-950/60 border border-blue-700/60 rounded-xl text-blue-400">
            <Printer class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-100">Print Engineering Diagram Sheet</h2>
            <p class="text-xs text-slate-400">
              Full panel & wiring schematic with engineering title block ready for landscape printing or PDF save.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20"
            onclick={handlePrintSheet}
          >
            <Printer class="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition"
            onclick={onClose}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Preview Sheet -->
      <div class="p-6 flex-1 overflow-y-auto space-y-4">
        <div class="border-2 border-slate-700 rounded-xl overflow-hidden bg-slate-950">
          <div class="p-4 flex items-center justify-center bg-slate-950 max-h-[56vh] overflow-auto">
            {#if previewData}
              <div class="max-w-full max-h-[52vh] flex items-center justify-center [&>svg]:max-h-[50vh] [&>svg]:w-auto">
                {@html previewData.svgMarkup}
              </div>
            {:else}
              <div class="py-12 text-slate-500 text-xs">Preparing diagram preview...</div>
            {/if}
          </div>

          <!-- Engineering Title Block Preview -->
          <div class="grid grid-cols-1 sm:grid-cols-4 border-t-2 border-slate-700 bg-slate-900 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            <div class="p-3">
              <div class="text-[10px] font-bold uppercase text-slate-400">Project Title</div>
              <div class="font-bold text-slate-100 mt-0.5 truncate">{panelStore.projectTitle}</div>
            </div>
            <div class="p-3">
              <div class="text-[10px] font-bold uppercase text-slate-400">Prepared By</div>
              <div class="font-semibold text-slate-200 mt-0.5 truncate">{panelStore.projectAuthor || '—'}</div>
            </div>
            <div class="p-3">
              <div class="text-[10px] font-bold uppercase text-slate-400">System Summary</div>
              <div class="font-mono text-slate-200 mt-0.5">
                {panelStore.panels.length} Panel(s) • {panelStore.devices.length} Breakers ({panelStore.activePanel.wireStandard})
              </div>
            </div>
            <div class="p-3">
              <div class="text-[10px] font-bold uppercase text-slate-400">Cloud Reference</div>
              <div class="font-mono text-blue-400 mt-0.5 truncate">
                {panelStore.cloudPlanId ? `/plan/${panelStore.cloudPlanId}` : 'Local Workspace'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

