<script lang="ts">
  import { panelStore } from "#lib/state.svelte";
  import { WIRE_GAUGES } from "#lib/wireStandards";
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
    Sparkles,
    Trash2,
    ArrowUpDown,
    Minus,
    Plus,
    ExternalLink,
  } from "@lucide/svelte";

  interface Props {
    onOpenBOM: () => void;
    onOpenLabels: () => void;
    onOpenDRC: () => void;
  }

  let { onOpenBOM, onOpenLabels, onOpenDRC }: Props = $props();

  let fileInput: HTMLInputElement | null = $state(null);
  let showBusbarModal = $state(false);

  // Manual Busbar form state
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
    a.download = `${panelStore.config.name.toLowerCase().replace(/\s+/g, "_")}_circuit_plan.json`;
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
    a.download = `${panelStore.config.name.toLowerCase().replace(/\s+/g, "_")}.svg`;
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
    );
    showBusbarModal = false;
  }
</script>

<header
  class="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-4 text-slate-200 select-none"
>
  <!-- Left: Branding, Name & Presets -->
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-sm"
      >
        CB
      </div>
      <div>
        <input
          type="text"
          bind:value={panelStore.config.name}
          class="bg-transparent hover:bg-slate-800 focus:bg-slate-800 text-sm font-semibold text-slate-100 rounded px-1.5 py-0.5 border border-transparent focus:border-slate-700 outline-none w-56 truncate"
          title="Click to rename panel"
        />
        <div class="text-[10px] text-slate-400 px-1.5">
          {panelStore.config.slotsPerRow}M × {panelStore.config.rows} Rows DIN Enclosure
        </div>
      </div>
    </div>

    <!-- Presets Quick Dropdown -->
    <select
      class="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 outline-none hover:border-slate-600 transition"
      onchange={(e) =>
        panelStore.applyPreset((e.target as HTMLSelectElement).value)}
      value="{panelStore.config.rows}-Row {panelStore.config.rows *
        panelStore.config.slotsPerRow}M"
    >
      <option value="1-Row 12M">1-Row (12M)</option>
      <option value="2-Row 24M">2-Row (24M)</option>
      <option value="3-Row 36M">3-Row (36M)</option>
      <option value="2-Row 36M">2-Row (36M / 18 per row)</option>
      <option value="4-Row 48M">4-Row (48M)</option>
    </select>

    <!-- Rail Spacing Quick Adjuster -->
    <div
      class="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 shadow-sm"
      title="Distance between DIN rails: Pitch {panelStore.config.railSpacing ||
        230}px (~{Math.round(
        (panelStore.config.railSpacing || 230) * 0.409,
      )}mm), Wire Gutter: {(panelStore.config.railSpacing || 230) -
        160}px (~{Math.round(
        ((panelStore.config.railSpacing || 230) - 160) * 0.409,
      )}mm)"
    >
      <ArrowUpDown class="w-3.5 h-3.5 text-blue-400" />
      <span class="text-[11px] text-slate-400 font-medium">Rails:</span>
      <button
        class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition font-bold"
        onclick={() => panelStore.adjustRailSpacing(-10)}
        title="Decrease distance between rails (-10px)"
      >
        <Minus class="w-3 h-3" />
      </button>
      <span
        class="font-mono text-blue-400 font-semibold px-0.5 text-center min-w-[38px]"
      >
        {panelStore.config.railSpacing || 230}px
      </span>
      <button
        class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition font-bold"
        onclick={() => panelStore.adjustRailSpacing(10)}
        title="Increase distance between rails (+10px)"
      >
        <Plus class="w-3 h-3" />
      </button>
    </div>
  </div>

  <!-- Center: Primary Tools & Controls -->
  <div
    class="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800"
  >
    <!-- Select Tool -->
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition {panelStore.activeTool ===
      'select'
        ? 'bg-blue-600 text-white shadow'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      onclick={() => (panelStore.activeTool = "select")}
      title="Select and drag devices"
    >
      <MousePointer class="w-3.5 h-3.5" />
      <span>Select</span>
    </button>

    <!-- Wire Tool -->
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition {panelStore.activeTool ===
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
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition {panelStore.activeTool ===
      'busbar'
        ? 'bg-blue-600 text-white shadow'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      onclick={() => {
        panelStore.activeTool = "busbar";
        showBusbarModal = true;
      }}
      title="Manually place comb busbar across breakers"
    >
      <Layers class="w-3.5 h-3.5" />
      <span>Comb Busbar</span>
    </button>

    <!-- Detached Field Block -->
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-100 hover:bg-amber-950/60 border border-amber-600/50 transition shadow-sm"
      onclick={() => panelStore.addFieldBlock()}
      title="Add detached external connection block (e.g. 'From House', 'To Airconditioner') that can be placed anywhere on the canvas"
    >
      <ExternalLink class="w-3.5 h-3.5 text-amber-400" />
      <span>+ Field Block</span>
    </button>

    <div class="w-px h-5 bg-slate-800 mx-1"></div>

    <!-- Active Wire Settings (Standard, Role, Gauge) -->
    <div class="flex items-center gap-2">
      <!-- Standard Toggle (PEC vs IEC) -->
      <button
        class="text-xs px-2 py-1 rounded font-semibold border {panelStore.config
          .wireStandard === 'PEC'
          ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
          : 'bg-blue-950/60 text-blue-300 border-blue-700/60'} transition"
        onclick={() => {
          panelStore.config.wireStandard =
            panelStore.config.wireStandard === "PEC" ? "IEC" : "PEC";
          panelStore.saveToLocalStorage();
        }}
        title="Toggle Electrical Standard (PEC Philippine vs IEC European)"
      >
        {panelStore.config.wireStandard === "PEC" ? "PEC (PH)" : "IEC (EU)"}
      </button>

      <!-- Conductor Role -->
      <select
        bind:value={panelStore.activeWireRole}
        class="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 outline-none hover:border-slate-600 transition"
        title="Active Wire Conductor Role"
      >
        <option value="line1">L1 / Hot 1</option>
        <option value="line2">L2 / Hot 2</option>
        <option value="line3">L3 / Hot 3</option>
        <option value="neutral">Neutral (N)</option>
        <option value="earth">Ground (PE)</option>
        <option value="dc_pos">DC (+)</option>
        <option value="dc_neg">DC (-)</option>
        <option value="signal">Control / Signal</option>
      </select>

      <!-- Gauge Selector -->
      <select
        bind:value={panelStore.activeWireGauge}
        class="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 outline-none hover:border-slate-600 transition"
        title="Wire Cross-Section / Gauge"
      >
        {#each WIRE_GAUGES as g}
          <option value={g.metric}
            >{g.metric} mm² ({g.awg}) - {g.maxAmps}A</option
          >
        {/each}
      </select>

      <!-- Default Routing Mode Toggle -->
      <button
        class="text-xs px-2 py-1 rounded font-medium border {panelStore.activeWireRouting ===
        'orthogonal'
          ? 'bg-slate-700 text-white border-slate-600'
          : 'bg-slate-800 text-slate-400 border-slate-700'} transition"
        onclick={() => {
          panelStore.activeWireRouting =
            panelStore.activeWireRouting === "orthogonal"
              ? "curved"
              : "orthogonal";
        }}
        title="Toggle default routing mode: Right Angle vs Curved"
      >
        {panelStore.activeWireRouting === "orthogonal"
          ? "90° Angles"
          : "Curved"}
      </button>
    </div>
  </div>

  <!-- Right: Actions, DRC, BOM & Exports -->
  <div class="flex items-center gap-2">
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
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition {panelStore
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
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
      onclick={onOpenBOM}
      title="View Bill of Materials & Wire Cut-list"
    >
      <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400" />
      <span>BOM</span>
    </button>

    <!-- Print Label Strips Button -->
    <button
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
      onclick={onOpenLabels}
      title="Generate 18mm Faceplate Label Stickers"
    >
      <Printer class="w-3.5 h-3.5 text-purple-400" />
      <span>Labels</span>
    </button>

    <!-- Export SVG Button -->
    <button
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
      onclick={handleExportSVG}
      title="Export Scalable Vector Graphics (SVG)"
    >
      <Download class="w-4 h-4" />
    </button>

    <!-- Export JSON Button -->
    <button
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
      onclick={handleExportJSON}
      title="Export Project JSON File"
    >
      <span class="text-[10px] font-mono font-bold">JSON</span>
    </button>

    <!-- Import JSON Hidden Input -->
    <input
      type="file"
      accept=".json"
      bind:this={fileInput}
      class="hidden"
      onchange={handleFileImport}
    />
    <button
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
      onclick={() => fileInput?.click()}
      title="Import Project JSON File"
    >
      <Upload class="w-4 h-4" />
    </button>

    <!-- Sample Project Quick Load -->
    <button
      class="p-1.5 rounded-lg text-amber-400 hover:bg-slate-800 border border-slate-800 transition"
      onclick={() => {
        if (
          confirm(
            "Load sample Philippine 230V consumer unit? This will replace your current layout.",
          )
        ) {
          panelStore.loadSampleProject();
        }
      }}
      title="Load Philippine Sample Distribution Board"
    >
      <Sparkles class="w-4 h-4" />
    </button>

    <!-- Clear Layout -->
    <button
      class="p-1.5 rounded-lg text-red-400 hover:bg-slate-800 border border-slate-800 transition"
      onclick={() => {
        if (confirm("Clear entire layout and start fresh?")) {
          panelStore.clearProject();
        }
      }}
      title="Clear Layout"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</header>

<!-- Modal for Manual Comb Busbar Placement -->
{#if showBusbarModal}
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-200"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <Layers class="w-5 h-5 text-blue-400" />
          Add Manual Comb Busbar
        </h3>
        <button
          class="text-slate-400 hover:text-slate-200 text-lg font-bold"
          onclick={() => (showBusbarModal = false)}
        >
          &times;
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-medium text-slate-300 mb-1"
            >Target DIN Rail Row</label
          >
          <select
            bind:value={busbarRow}
            class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
          >
            {#each Array(panelStore.config.rows) as _, r}
              <option value={r}>Rail Row {r + 1}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block font-medium text-slate-300 mb-1"
            >Terminal Position</label
          >
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
          <label class="block font-medium text-slate-300 mb-1"
            >Comb Busbar Type</label
          >
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
            <label class="block font-medium text-slate-300 mb-1"
              >Start Module Slot (1-{panelStore.config.slotsPerRow})</label
            >
            <input
              type="number"
              min="1"
              max={panelStore.config.slotsPerRow}
              value={busbarStartSlot + 1}
              oninput={(e) =>
                (busbarStartSlot = Math.max(
                  0,
                  parseInt((e.target as HTMLInputElement).value) - 1 || 0,
                ))}
              class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
            />
          </div>
          <div>
            <label class="block font-medium text-slate-300 mb-1"
              >Span Length (Modules)</label
            >
            <input
              type="number"
              min="2"
              max={panelStore.config.slotsPerRow - busbarStartSlot}
              bind:value={busbarSpan}
              class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
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
