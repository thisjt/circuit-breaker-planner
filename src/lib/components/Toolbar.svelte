<script lang="ts">
  import { panelStore } from "#lib/state.svelte";
  import { WIRE_GAUGES, getWireColor } from "#lib/wireStandards";
  import type { WireRole, WireStandard } from "#lib/types";
  import {
    MousePointer,
    Cable,
    Layers,
    Undo2,
    Redo2,
    AlertTriangle,
    FileSpreadsheet,
    Printer,
    Download,
    Upload,
    Trash2,
    Plus,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
  } from "@lucide/svelte";

  interface Props {
    onOpenBOM: () => void;
    onOpenLabels: () => void;
    onOpenDRC: () => void;
    isLeftSidebarOpen?: boolean;
    isRightSidebarOpen?: boolean;
    onToggleLeftSidebar?: () => void;
    onToggleRightSidebar?: () => void;
  }

  let {
    onOpenBOM,
    onOpenLabels,
    onOpenDRC,
    isLeftSidebarOpen = true,
    isRightSidebarOpen = true,
    onToggleLeftSidebar,
    onToggleRightSidebar,
  }: Props = $props();

  let fileInput: HTMLInputElement | null = $state(null);
  let showBusbarModal = $state(false);

  // Manual Busbar form state
  let busbarPanelId = $state(panelStore.activePanelId);
  let busbarRow = $state(0);
  let busbarPosition = $state<"top" | "bottom">("top");
  let busbarType = $state<"1P" | "1P+N" | "2P" | "3P">("1P");
  let busbarStartSlot = $state(0);
  let busbarSpan = $state(4);

  function handleFileImport(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = panelStore.importJSON(content);
        if (!success) {
          alert("Failed to parse JSON project file.");
        }
      }
    };
    reader.readAsText(file);
    input.value = "";
  }

  function handleExportJSON() {
    const jsonStr = panelStore.exportJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${panelStore.activePanel.name.toLowerCase().replace(/\s+/g, "_")}_circuit_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportSVG() {
    const svg = document.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${panelStore.activePanel.name.toLowerCase().replace(/\s+/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAddBusbarSubmit() {
    panelStore.addBusbar(
      busbarRow,
      busbarPosition,
      busbarType,
      busbarStartSlot,
      busbarSpan,
      busbarPanelId,
    );
    showBusbarModal = false;
  }
</script>

<header
  class="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-4 text-slate-200 select-none overflow-x-auto"
>
  <!-- Left: Multi-Panel Switcher, Brand & Presets -->
  <div class="flex items-center gap-3 flex-shrink-0">
    <div class="flex items-center gap-2">
      {#if onToggleLeftSidebar}
        <button
          type="button"
          class="p-1.5 rounded-lg border transition flex items-center justify-center {isLeftSidebarOpen
            ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}"
          onclick={onToggleLeftSidebar}
          title="{isLeftSidebarOpen ? 'Hide' : 'Show'} Left Component Library ([)"
        >
          {#if isLeftSidebarOpen}
            <PanelLeftClose class="w-4 h-4" />
          {:else}
            <PanelLeftOpen class="w-4 h-4" />
          {/if}
        </button>
      {/if}

      <div
        class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-sm flex-shrink-0"
      >
        CB
      </div>

      <!-- Breaker Panel Switcher & + Add Panel -->
      <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <select
          value={panelStore.activePanelId}
          onchange={(e) => {
            const id = (e.target as HTMLSelectElement).value;
            panelStore.setActivePanel(id);
            panelStore.select('panel', id);
          }}
          class="bg-slate-900 text-xs font-bold text-blue-400 border border-slate-700 rounded-lg px-2 py-1 outline-none hover:border-blue-500 transition max-w-44 truncate"
          title="Switch Active Breaker Panel"
        >
          {#each panelStore.panels as p}
            <option value={p.id}>⚡ {p.name}</option>
          {/each}
        </select>
        <button
          class="px-2 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1"
          onclick={() => panelStore.addPanel()}
          title="Add another Breaker Panel to the canvas"
        >
          <Plus class="w-3 h-3 text-blue-400" />
          <span>Panel</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Center: Primary Tools -->
  <div
    class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-shrink-0"
  >
    <!-- Select Tool -->
    <button
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {panelStore.activeTool ===
      'select'
        ? 'bg-blue-600 text-white shadow'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      onclick={() => (panelStore.activeTool = "select")}
      title="Select and drag devices or equipment"
    >
      <MousePointer class="w-3.5 h-3.5" />
      <span>Select</span>
    </button>

    <!-- Wire Tool -->
    <button
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {panelStore.activeTool ===
      'wire'
        ? 'bg-blue-600 text-white shadow'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      onclick={() => (panelStore.activeTool = "wire")}
      title="Click terminals to connect wires"
    >
      <Cable class="w-3.5 h-3.5" />
      <span>Wire Tool</span>
    </button>

    <!-- Manual Busbar Tool -->
    <button
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {panelStore.activeTool ===
      'busbar'
        ? 'bg-blue-600 text-white shadow'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      onclick={() => {
        panelStore.activeTool = "busbar";
        busbarPanelId = panelStore.activePanelId;
        showBusbarModal = true;
      }}
      title="Manually place comb busbar across breakers"
    >
      <Layers class="w-3.5 h-3.5" />
      <span>Busbar</span>
    </button>
  </div>

  <!-- Right: Actions, DRC, BOM & Exports -->
  <div class="flex items-center gap-2 flex-shrink-0">
    <!-- Active Wire Settings -->
    <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
      <button
        class="text-xs px-2 py-0.5 rounded font-semibold border {panelStore.activePanel
          .wireStandard === 'PEC'
          ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
          : 'bg-blue-950/60 text-blue-300 border-blue-700/60'} transition"
        onclick={() => {
          panelStore.activePanel.wireStandard =
            panelStore.activePanel.wireStandard === "PEC" ? "IEC" : "PEC";
          panelStore.saveToLocalStorage();
        }}
        title="Toggle Electrical Standard (PEC vs IEC)"
      >
        {panelStore.activePanel.wireStandard === "PEC" ? "PEC" : "IEC"}
      </button>

      <div class="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded pl-1.5 pr-1 py-0.5 hover:border-slate-600 transition">
        <span
          class="w-3 h-3 rounded-full inline-block border border-slate-300 ring-1 ring-white/30 flex-shrink-0"
          style="background-color: {getWireColor(panelStore.activeWireRole, panelStore.activePanel.wireStandard).hex};"
          title={getWireColor(panelStore.activeWireRole, panelStore.activePanel.wireStandard).description}
        ></span>
        <select
          bind:value={panelStore.activeWireRole}
          class="bg-slate-800 text-xs text-slate-300 outline-none cursor-pointer"
          title="Active Wire Conductor Role"
        >
          <option value="line1">L1 / Hot</option>
          <option value="line2">L2 / Phase 2</option>
          <option value="line3">L3 / Phase 3</option>
          <option value="neutral">Neutral (N)</option>
          <option value="earth">Ground (PE)</option>
          <option value="dc_pos">DC (+) Solar/Bat</option>
          <option value="dc_neg">DC (-) Return</option>
        </select>
      </div>

      <select
        bind:value={panelStore.activeWireGauge}
        class="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 outline-none hover:border-slate-600 transition font-mono"
        title="Wire Cross-Section / Gauge"
      >
        {#each WIRE_GAUGES as g}
          <option value={g.metric}>{g.metric} mm²</option>
        {/each}
      </select>
    </div>

    <!-- Undo / Redo -->
    <div
      class="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700"
    >
      <button
        class="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition"
        onclick={() => panelStore.undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 class="w-3.5 h-3.5" />
      </button>
      <button
        class="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition"
        onclick={() => panelStore.redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- DRC Warnings Indicator Button -->
    <button
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition {panelStore
        .drcWarnings.length > 0
        ? 'bg-amber-950/60 border-amber-600/70 text-amber-300 hover:bg-amber-900/60'
        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}"
      onclick={onOpenDRC}
      title="Electrical Design Rule Checks (DRC)"
    >
      <AlertTriangle
        class="w-3.5 h-3.5 {panelStore.drcWarnings.length > 0
          ? 'text-amber-400'
          : ''}"
      />
      <span>{panelStore.drcWarnings.length} Issues</span>
    </button>

    <!-- Bill of Materials (BOM) Button -->
    <button
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
      onclick={onOpenBOM}
      title="View Bill of Materials & Wire Cut-list"
    >
      <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400" />
      <span>BOM</span>
    </button>

    <!-- Print Label Strips Button -->
    <button
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
      onclick={onOpenLabels}
      title="Generate 18mm Faceplate Label Stickers"
    >
      <Printer class="w-3.5 h-3.5 text-blue-400" />
      <span>Labels</span>
    </button>

    <!-- Export JSON / SVG -->
    <div class="flex items-center gap-1">
      <button
        class="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
        onclick={handleExportJSON}
        title="Export Project File (.json)"
      >
        <Download class="w-3.5 h-3.5" />
      </button>

      <label
        class="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
        title="Import Project (.json)"
      >
        <Upload class="w-3.5 h-3.5" />
        <input
          type="file"
          accept=".json"
          bind:this={fileInput}
          onchange={handleFileImport}
          class="hidden"
        />
      </label>

      <button
        class="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
        onclick={() => {
          if (confirm("Clear all breakers, equipment, and wires in this project?")) {
            panelStore.clearProject();
          }
        }}
        title="Clear Canvas"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>

      {#if onToggleRightSidebar}
        <button
          type="button"
          class="p-1.5 rounded-lg border transition flex items-center justify-center ml-1 {isRightSidebarOpen
            ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}"
          onclick={onToggleRightSidebar}
          title="{isRightSidebarOpen ? 'Hide' : 'Show'} Right Inspector Panel (])"
        >
          {#if isRightSidebarOpen}
            <PanelRightClose class="w-4 h-4" />
          {:else}
            <PanelRightOpen class="w-4 h-4" />
          {/if}
        </button>
      {/if}
    </div>
  </div>
</header>

<!-- MANUAL BUSBAR PLACEMENT MODAL -->
{#if showBusbarModal}
  {@const targetP = panelStore.panels.find((p) => p.id === busbarPanelId) || panelStore.activePanel}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-200"
    >
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div class="flex items-center gap-2">
          <Layers class="w-5 h-5 text-blue-400" />
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-100">
            Place Comb Busbar
          </h3>
        </div>
        <button
          class="text-slate-400 hover:text-white"
          onclick={() => (showBusbarModal = false)}
        >
          ✕
        </button>
      </div>

      <div class="space-y-4 text-xs">
        {#if panelStore.panels.length > 1}
          <div>
            <label class="block font-medium text-slate-300 mb-1">Target Panel</label>
            <select
              bind:value={busbarPanelId}
              class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
            >
              {#each panelStore.panels as p}
                <option value={p.id}>⚡ {p.name}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div>
          <label class="block font-medium text-slate-300 mb-1">Target DIN Rail Row</label>
          <select
            bind:value={busbarRow}
            class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
          >
            {#each Array(targetP.rows) as _, r}
              <option value={r}>Rail Row {r + 1}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block font-medium text-slate-300 mb-1">Terminal Position</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="py-2 rounded-lg border font-semibold {busbarPosition ===
              'top'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300'}"
              onclick={() => (busbarPosition = "top")}
            >
              Top Terminals (Line In)
            </button>
            <button
              class="py-2 rounded-lg border font-semibold {busbarPosition ===
              'bottom'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300'}"
              onclick={() => (busbarPosition = "bottom")}
            >
              Bottom Terminals
            </button>
          </div>
        </div>

        <div>
          <label class="block font-medium text-slate-300 mb-1">Comb Busbar Type</label>
          <select
            bind:value={busbarType}
            class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
          >
            <option value="1P">1-Phase Comb (1P)</option>
            <option value="1P+N">1-Phase + Neutral (1P+N)</option>
            <option value="2P">2-Phase / 230V Delta (2P)</option>
            <option value="3P">3-Phase Comb (3P)</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-300 mb-1">Start Module Slot (1-{targetP.slotsPerRow})</label>
            <input
              type="number"
              min="1"
              max={targetP.slotsPerRow}
              value={busbarStartSlot + 1}
              oninput={(e) =>
                (busbarStartSlot = Math.max(
                  0,
                  parseInt((e.target as HTMLInputElement).value) - 1 || 0,
                ))}
              class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none font-mono"
            />
          </div>
          <div>
            <label class="block font-medium text-slate-300 mb-1">Span Length (Modules)</label>
            <input
              type="number"
              min="2"
              max={targetP.slotsPerRow - busbarStartSlot}
              bind:value={busbarSpan}
              class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button
          class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          onclick={() => (showBusbarModal = false)}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/30"
          onclick={handleAddBusbarSubmit}
        >
          Place Busbar
        </button>
      </div>
    </div>
  </div>
{/if}
