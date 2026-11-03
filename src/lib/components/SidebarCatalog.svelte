<script lang="ts">
  import { DEVICE_CATALOG } from "#lib/catalog";
  import { panelStore } from "#lib/state.svelte";
  import type { DeviceCategory, DeviceDefinition } from "#lib/types";
  import {
    Search,
    ShieldAlert,
    Power,
    Zap,
    Cpu,
    Grid,
    SlidersHorizontal,
    PlusCircle,
  } from "@lucide/svelte";

  let searchQuery = $state("");
  let selectedCategory = $state<DeviceCategory | "all">("all");

  const categories: { id: DeviceCategory | "all"; label: string; icon: any }[] =
    [
      { id: "all", label: "All", icon: Grid },
      { id: "main_switch", label: "Main Switches", icon: Power },
      { id: "rcd", label: "RCD / RCCB", icon: ShieldAlert },
      { id: "rcbo", label: "RCBO", icon: Zap },
      { id: "mcb", label: "MCB Breakers", icon: SlidersHorizontal },
      { id: "spd", label: "Surge (SPD)", icon: Zap },
      { id: "terminal", label: "Terminals & Field Blocks", icon: Grid },
      { id: "smart", label: "Smart Relays & Meters", icon: Cpu },
      { id: "ats", label: "Transfer Switches (ATS/MTS)", icon: Power },
    ];

  const filteredDevices = $derived(
    DEVICE_CATALOG.filter((d) => {
      const matchesCat =
        selectedCategory === "all" || d.category === selectedCategory;
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.typeId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }),
  );

  function handleDeviceSelect(def: DeviceDefinition) {
    // Attempt to place in first available slot on row 1 or 2
    for (let r = 0; r < panelStore.config.rows; r++) {
      for (
        let s = 0;
        s <= panelStore.config.slotsPerRow - def.widthModules;
        s++
      ) {
        if (panelStore.canPlaceDevice(r, s, def.widthModules)) {
          panelStore.placeDevice(def.typeId, r, s);
          return;
        }
      }
    }
    // If all full, alert user
    alert(`Could not find an empty ${def.widthModules}M slot on any DIN rail.`);
  }

  function handleDragStart(def: DeviceDefinition) {
    panelStore.pendingPlaceTypeId = def.typeId;
  }
</script>

<aside
  class="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none"
>
  <!-- Search Bar -->
  <div class="p-3 border-b border-slate-800">
    <div class="relative">
      <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
      <input
        type="text"
        placeholder="Search breakers, field block, RCD..."
        bind:value={searchQuery}
        class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 transition"
      />
    </div>

    <!-- Category Pills -->
    <div class="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
      {#each categories as cat}
        <button
          class="px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap transition font-medium {selectedCategory ===
          cat.id
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
          onclick={() => (selectedCategory = cat.id)}
        >
          {cat.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Device Catalog List -->
  <div class="flex-1 overflow-y-auto p-3 space-y-2">
    {#if selectedCategory === "all" || selectedCategory === "terminal"}
      <!-- Freestanding Detached Field Block Card -->
      <div
        class="bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-600/60 hover:border-amber-400 rounded-xl p-3 cursor-pointer transition shadow-md group flex flex-col gap-1.5"
        onclick={() => panelStore.addFieldBlock()}
        role="button"
        tabindex="0"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-7 rounded-sm bg-amber-500 flex-shrink-0"></div>
            <div>
              <div class="text-xs font-bold text-amber-300 group-hover:text-amber-200 leading-tight">
                + Detached Field Block
              </div>
              <div class="text-[10px] text-amber-400/80 font-mono mt-0.5">
                Freestanding (Off-Rail) • 2 Terminals
              </div>
            </div>
          </div>
          <span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
            Off-Rail
          </span>
        </div>
        <p class="text-[10px] text-slate-300 leading-relaxed">
          Freestanding 2-terminal block for external supply feeds ("From House", "From Solar") or appliance circuits ("To Airconditioner"). Place freely anywhere off the DIN rail.
        </p>
      </div>
    {/if}

    <div
      class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2"
    >
      Component Library ({filteredDevices.length})
    </div>

    {#each filteredDevices as def}
      <div
        class="bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl p-2.5 cursor-grab active:cursor-grabbing transition group flex flex-col gap-1.5 shadow-sm"
        draggable="true"
        ondragstart={() => handleDragStart(def)}
        onclick={() => handleDeviceSelect(def)}
        role="button"
        tabindex="0"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <!-- Color pill -->
            <div
              class="w-2.5 h-7 rounded-sm flex-shrink-0"
              style="background-color: {def.colorAccent || '#64748b'};"
            ></div>
            <div>
              <div
                class="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition leading-tight"
              >
                {def.name}
              </div>
              <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                {def.widthModules} TE ({def.widthModules * 18}mm)
                {#if def.ratedAmps}
                  • {def.curve || ""}{def.ratedAmps}A{/if}
                {#if def.residualCurrentMa}
                  • {def.residualCurrentMa}mA{/if}
              </div>
            </div>
          </div>

          <button
            class="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-300 transition"
            title="Add to next available slot"
            onclick={(e) => {
              e.stopPropagation();
              handleDeviceSelect(def);
            }}
          >
            <PlusCircle class="w-4 h-4" />
          </button>
        </div>

        <p class="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
          {def.description}
        </p>

        <!-- Terminals badge -->
        <div
          class="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 font-mono"
        >
          <span>{def.terminals.length} Terminals:</span>
          <span class="truncate">
            {def.terminals.map((t) => t.label).join(", ")}
          </span>
        </div>
      </div>
    {/each}

    {#if filteredDevices.length === 0}
      <div class="text-center py-8 text-xs text-slate-500">
        No components match "{searchQuery}"
      </div>
    {/if}
  </div>

  <!-- Bottom Tip -->
  <div
    class="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40"
  >
    <span class="font-semibold text-slate-300">Tip:</span> Click any component to
    auto-place into the first available DIN rail slot, or drag it onto the canvas.
  </div>
</aside>
