<script lang="ts">
  import { DEVICE_CATALOG } from "#lib/catalog";
  import { panelStore } from "#lib/state.svelte";
  import type { DeviceCategory, DeviceDefinition } from "#lib/types";
  import {
    Search,
    X,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    PanelLeftClose,
    ShieldAlert,
    Power,
    Zap,
    Cpu,
    Grid,
    SlidersHorizontal,
    PlusCircle,
    Sun,
    Battery,
    Layers,
  } from "@lucide/svelte";

  interface Props {
    onCollapse?: () => void;
  }

  let { onCollapse }: Props = $props();

  let searchQuery = $state("");

  const ACCORDION_STORAGE_KEY = "cb_planner_sidebar_accordions_v1";

  const DEFAULT_EXPANDED_SECTIONS: Record<string, boolean> = {
    solar: true,
    mccb_cat: false,
    main_switch: true,
    rcd: false,
    rcbo: false,
    mcb: true,
    spd: false,
    ats: false,
    smart: false,
    terminal: false,
    accessory: false,
  };

  function loadExpandedSections(): Record<string, boolean> {
    if (typeof window === "undefined") {
      return { ...DEFAULT_EXPANDED_SECTIONS };
    }
    try {
      const saved = localStorage.getItem(ACCORDION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_EXPANDED_SECTIONS, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Failed to load sidebar accordion state:", e);
    }
    return { ...DEFAULT_EXPANDED_SECTIONS };
  }

  function saveExpandedSections(stateMap: Record<string, boolean>) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(stateMap));
    } catch (e) {
      console.warn("Failed to save sidebar accordion state:", e);
    }
  }

  interface SectionDef {
    id: string;
    label: string;
    icon: any;
    accentColor: string; // text and background styles
    badgeColor: string;
    category?: DeviceCategory;
    isSpecial?: "solar" | "mccb_cat" | "terminal";
  }

  const SECTIONS: SectionDef[] = [
    {
      id: "solar",
      label: "Solar & Energy Storage",
      icon: Sun,
      accentColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      badgeColor: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      isSpecial: "solar",
    },
    {
      id: "mccb_cat",
      label: "MCCB Heavy Duty Breakers",
      icon: ShieldAlert,
      accentColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      badgeColor: "text-rose-300 bg-rose-500/20 border-rose-500/30",
      isSpecial: "mccb_cat",
    },
    {
      id: "main_switch",
      label: "Main Switches & Isolators",
      icon: Power,
      accentColor: "text-red-400 bg-red-500/10 border-red-500/20",
      badgeColor: "text-red-300 bg-red-500/20 border-red-500/30",
      category: "main_switch",
    },
    {
      id: "rcd",
      label: "RCD / RCCB Safety Switches",
      icon: ShieldAlert,
      accentColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      badgeColor: "text-blue-300 bg-blue-500/20 border-blue-500/30",
      category: "rcd",
    },
    {
      id: "rcbo",
      label: "RCBO Residual & Overcurrent",
      icon: Zap,
      accentColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      badgeColor: "text-sky-300 bg-sky-500/20 border-sky-500/30",
      category: "rcbo",
    },
    {
      id: "mcb",
      label: "MCB Circuit Breakers",
      icon: SlidersHorizontal,
      accentColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      badgeColor: "text-indigo-300 bg-indigo-500/20 border-indigo-500/30",
      category: "mcb",
    },
    {
      id: "spd",
      label: "Surge Protective Devices (SPD)",
      icon: Zap,
      accentColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      badgeColor: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      category: "spd",
    },
    {
      id: "ats",
      label: "Transfer Switches (ATS / MTS)",
      icon: Power,
      accentColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badgeColor: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
      category: "ats",
    },
    {
      id: "smart",
      label: "Smart Relays & Energy Meters",
      icon: Cpu,
      accentColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      badgeColor: "text-purple-300 bg-purple-500/20 border-purple-500/30",
      category: "smart",
    },
    {
      id: "terminal",
      label: "Terminals & Field Blocks",
      icon: Grid,
      accentColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      badgeColor: "text-teal-300 bg-teal-500/20 border-teal-500/30",
      category: "terminal",
      isSpecial: "terminal",
    },
    {
      id: "accessory",
      label: "Accessories & Hardware",
      icon: Layers,
      accentColor: "text-slate-400 bg-slate-500/10 border-slate-500/20",
      badgeColor: "text-slate-300 bg-slate-500/20 border-slate-500/30",
      category: "accessory",
    },
  ];

  // Accordion open/collapse states (persisted in localStorage)
  let expandedSections = $state<Record<string, boolean>>(loadExpandedSections());

  function toggleSection(id: string) {
    expandedSections[id] = !expandedSections[id];
    saveExpandedSections(expandedSections);
  }

  function expandAll() {
    for (const s of SECTIONS) {
      expandedSections[s.id] = true;
    }
    saveExpandedSections(expandedSections);
  }

  function collapseAll() {
    for (const s of SECTIONS) {
      expandedSections[s.id] = false;
    }
    saveExpandedSections(expandedSections);
  }

  const cleanQuery = $derived(searchQuery.trim().toLowerCase());
  const isSearching = $derived(cleanQuery.length > 0);

  // Solar equipment items definition & search match
  const solarItems = [
    {
      id: "solar_panel",
      title: "+ Solar PV Module / String",
      subtitle: "Freestanding • Authorable W / V / A",
      tag: "PV In",
      tagClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      colorClass: "from-amber-400 to-amber-600",
      desc: "Free-place solar PV panel with authorable peak watts (W), voltage (V), and current (A). Connect PV+ / PV- directly to inverters or combiner SPDs.",
      keywords: "solar pv module string array panel watts voltage current power",
      action: () => panelStore.addSolarPanel(),
    },
    {
      id: "battery_storage",
      title: "+ Battery Storage (LiFePO4)",
      subtitle: "Freestanding • Auto Wh & kWh",
      tag: "Bat ±",
      tagClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      colorClass: "from-emerald-400 to-emerald-600",
      desc: "Free-place storage battery pack with authorable voltage (V) and current capacity (Ah). Automatically computes watt-hours (Wh / kWh) with live LED SoC bar.",
      keywords: "battery storage lifepo4 lithium bank ah kwh wh energy pack",
      action: () => panelStore.addBattery(),
    },
    {
      id: "hybrid_inv",
      title: "+ Hybrid Inverter",
      subtitle: "AC In • AC Out • Bat ± • PV In",
      tag: "Hybrid",
      tagClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      colorClass: "from-blue-400 to-blue-600",
      desc: "Authorable kW capacity hybrid inverter with dual MPPT PV In, Battery 48V In/Out, AC Grid Incomer, and AC Essential Loads Output.",
      keywords: "hybrid inverter kw mppt solar grid backup ac in out battery",
      action: () => panelStore.addHybridInverter(),
    },
    {
      id: "offgrid_inv",
      title: "+ Off-Grid Inverter",
      subtitle: "AC Out • Bat ± • PV In",
      tag: "Off-Grid",
      tagClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      colorClass: "from-cyan-400 to-cyan-600",
      desc: "Pure sine wave off-grid inverter with authorable kW capacity, Battery In/Out, PV string input, and AC Out feed for standalone consumer units.",
      keywords: "offgrid off-grid inverter standalone pure sine wave kw battery pv ac out",
      action: () => panelStore.addOffgridInverter(),
    },
  ];

  const filteredSolarItems = $derived(
    !isSearching
      ? solarItems
      : solarItems.filter(
          (item) =>
            item.title.toLowerCase().includes(cleanQuery) ||
            item.desc.toLowerCase().includes(cleanQuery) ||
            item.keywords.includes(cleanQuery)
        )
  );

  // MCCB items
  const mccbItems = [
    {
      id: "mccb_main",
      title: "+ Molded Case Circuit Breaker (MCCB)",
      subtitle: "Freestanding • Authorable Amps & kA",
      tag: "Heavy Duty",
      tagClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      colorClass: "from-rose-400 to-rose-600",
      desc: "High-amperage molded case breaker (63A–400A+, 36kA–50kA) for main service entrance or high-capacity sub-feeders with line/load bolt terminals.",
      keywords: "mccb molded case circuit breaker heavy duty industrial feeder main service 100a 160a 250a 400a ka",
      action: () => panelStore.addMCCB(),
    },
  ];

  const filteredMccbItems = $derived(
    !isSearching
      ? mccbItems
      : mccbItems.filter(
          (item) =>
            item.title.toLowerCase().includes(cleanQuery) ||
            item.desc.toLowerCase().includes(cleanQuery) ||
            item.keywords.includes(cleanQuery)
        )
  );

  // Field Block item
  const fieldBlockItem = {
    id: "field_block_detached",
    title: "+ Detached Field Block",
    subtitle: "Freestanding (Off-Rail) • 2 Terminals",
    tag: "Off-Rail",
    tagClass: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    colorClass: "from-teal-400 to-teal-600",
    desc: 'Freestanding 2-terminal block for external supply feeds ("From House", "From Solar") or appliance circuits ("To Airconditioner"). Place freely anywhere off the DIN rail.',
    keywords: "field block detached connection terminal junction freestanding house airconditioner off-rail 230v",
    action: () => panelStore.addFieldBlock(),
  };

  const showFieldBlockInTerminal = $derived(
    !isSearching ||
      fieldBlockItem.title.toLowerCase().includes(cleanQuery) ||
      fieldBlockItem.desc.toLowerCase().includes(cleanQuery) ||
      fieldBlockItem.keywords.includes(cleanQuery)
  );

  // Helper to filter DIN devices for a category
  function getFilteredDevicesForCategory(category?: DeviceCategory): DeviceDefinition[] {
    if (!category) return [];
    return DEVICE_CATALOG.filter((d) => {
      if (d.category !== category) return false;
      if (!isSearching) return true;
      return (
        d.name.toLowerCase().includes(cleanQuery) ||
        d.description.toLowerCase().includes(cleanQuery) ||
        d.typeId.toLowerCase().includes(cleanQuery)
      );
    });
  }

  // Calculate item count per section
  function getSectionCount(section: SectionDef): number {
    if (section.id === "solar") return filteredSolarItems.length;
    if (section.id === "mccb_cat") return filteredMccbItems.length;
    if (section.id === "terminal") {
      const dinCount = getFilteredDevicesForCategory(section.category).length;
      return dinCount + (showFieldBlockInTerminal ? 1 : 0);
    }
    return getFilteredDevicesForCategory(section.category).length;
  }

  function isSectionOpen(sectionId: string, count: number): boolean {
    if (isSearching) {
      // Auto-expand any section with matches during search
      return count > 0;
    }
    return !!expandedSections[sectionId];
  }

  function handleDeviceSelect(def: DeviceDefinition) {
    // Attempt to place in first available slot on active panel
    for (let r = 0; r < panelStore.config.rows; r++) {
      for (
        let s = 0;
        s <= panelStore.config.slotsPerRow - def.widthModules;
        s++
      ) {
        if (panelStore.canPlaceDevice(r, s, def.widthModules, panelStore.activePanelId)) {
          panelStore.placeDevice(def.typeId, r, s, panelStore.activePanelId);
          return;
        }
      }
    }
    // If all full, alert user
    alert(`Could not find an empty ${def.widthModules}M slot on active panel "${panelStore.config.name}".`);
  }

  function handleDragStart(def: DeviceDefinition) {
    panelStore.pendingPlaceTypeId = def.typeId;
  }

  const totalMatchingItems = $derived(
    SECTIONS.reduce((sum, sec) => sum + getSectionCount(sec), 0)
  );
</script>

<aside
  class="w-80 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none"
>
  <!-- Search Bar Header -->
  <div class="p-3 border-b border-slate-800 space-y-2">
    <div class="flex items-center gap-1.5">
      <div class="relative flex-1">
        <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search components (e.g. 63A, solar)..."
          bind:value={searchQuery}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 transition"
        />
        {#if searchQuery}
          <button
            type="button"
            class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition"
            onclick={() => (searchQuery = "")}
            title="Clear search"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        {/if}
      </div>
      {#if onCollapse}
        <button
          type="button"
          class="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition flex-shrink-0"
          onclick={onCollapse}
          title="Collapse Left Library Sidebar ([)"
        >
          <PanelLeftClose class="w-4 h-4" />
        </button>
      {/if}
    </div>

    <!-- Accordion Toolbar: Section Count & Expand/Collapse All Buttons -->
    <div class="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
      <div class="flex items-center gap-1.5 font-medium">
        {#if isSearching}
          <span class="text-blue-400 font-semibold">{totalMatchingItems} matches</span>
          <span>across catalog</span>
        {:else}
          <span class="text-slate-400 font-semibold">{SECTIONS.length} Categories</span>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="hover:text-blue-400 transition underline underline-offset-2"
          onclick={expandAll}
        >
          Expand All
        </button>
        <span class="text-slate-600">•</span>
        <button
          type="button"
          class="hover:text-blue-400 transition underline underline-offset-2"
          onclick={collapseAll}
        >
          Collapse All
        </button>
      </div>
    </div>
  </div>

  <!-- Accordion Sections List -->
  <div class="flex-1 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
    {#each SECTIONS as section}
      {@const count = getSectionCount(section)}
      {@const isOpen = isSectionOpen(section.id, count)}
      {@const dinDevices = getFilteredDevicesForCategory(section.category)}

      <!-- Hide section during active search if it has 0 matches -->
      {#if !isSearching || count > 0}
        <div class="group/section">
          <!-- Accordion Header Button -->
          <button
            type="button"
            class="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left bg-slate-900/90 hover:bg-slate-800/60 transition cursor-pointer select-none border-l-2 {isOpen ? 'border-blue-500 bg-slate-800/30' : 'border-transparent'}"
            onclick={() => toggleSection(section.id)}
            aria-expanded={isOpen}
          >
            <div class="flex items-center gap-2 min-w-0">
              <!-- Category Icon Badge -->
              <div
                class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border {section.accentColor}"
              >
                <section.icon class="w-3.5 h-3.5" />
              </div>

              <!-- Section Title -->
              <span class="text-xs font-semibold text-slate-200 group-hover/section:text-blue-300 transition truncate">
                {section.label}
              </span>
            </div>

            <!-- Right: Count Badge & Chevron -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span
                class="text-[10px] font-mono px-1.5 py-0.2 rounded-full border {section.badgeColor}"
              >
                {count}
              </span>
              <div class="text-slate-400 group-hover/section:text-slate-200 transition">
                {#if isOpen}
                  <ChevronDown class="w-4 h-4 text-blue-400" />
                {:else}
                  <ChevronRight class="w-4 h-4" />
                {/if}
              </div>
            </div>
          </button>

          <!-- Accordion Body Content -->
          {#if isOpen}
            <div class="p-2.5 bg-slate-950/50 space-y-2 border-b border-slate-800/40">

              <!-- Special Solar Items -->
              {#if section.id === "solar"}
                {#each filteredSolarItems as item}
                  <div
                    class="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-xl p-2.5 cursor-pointer transition shadow-sm group flex flex-col gap-1.5"
                    onclick={item.action}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.action(); } }}
                    role="button"
                    tabindex="0"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-7 rounded-sm bg-gradient-to-b {item.colorClass} flex-shrink-0"></div>
                        <div>
                          <div class="text-xs font-bold text-slate-100 group-hover:text-amber-300 leading-tight">
                            {item.title}
                          </div>
                          <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-mono border {item.tagClass}">
                        {item.tag}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                {/each}
              {/if}

              <!-- Special MCCB Item -->
              {#if section.id === "mccb_cat"}
                {#each filteredMccbItems as item}
                  <div
                    class="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-rose-500/60 rounded-xl p-2.5 cursor-pointer transition shadow-sm group flex flex-col gap-1.5"
                    onclick={item.action}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.action(); } }}
                    role="button"
                    tabindex="0"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-7 rounded-sm bg-gradient-to-b {item.colorClass} flex-shrink-0"></div>
                        <div>
                          <div class="text-xs font-bold text-slate-100 group-hover:text-rose-300 leading-tight">
                            {item.title}
                          </div>
                          <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-mono border {item.tagClass}">
                        {item.tag}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                {/each}
              {/if}

              <!-- Special Detached Field Block (in Terminal Section) -->
              {#if section.id === "terminal" && showFieldBlockInTerminal}
                <div
                  class="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-teal-500/60 rounded-xl p-2.5 cursor-pointer transition shadow-sm group flex flex-col gap-1.5"
                  onclick={fieldBlockItem.action}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fieldBlockItem.action(); } }}
                  role="button"
                  tabindex="0"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-7 rounded-sm bg-gradient-to-b {fieldBlockItem.colorClass} flex-shrink-0"></div>
                      <div>
                        <div class="text-xs font-bold text-slate-100 group-hover:text-teal-300 leading-tight">
                          {fieldBlockItem.title}
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                          {fieldBlockItem.subtitle}
                        </div>
                      </div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-mono border {fieldBlockItem.tagClass}">
                      {fieldBlockItem.tag}
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 leading-relaxed">
                    {fieldBlockItem.desc}
                  </p>
                </div>
              {/if}

              <!-- Regular DIN Devices -->
              {#each dinDevices as def}
                <div
                  class="bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-2.5 cursor-grab active:cursor-grabbing transition group flex flex-col gap-1.5 shadow-sm"
                  draggable="true"
                  ondragstart={() => handleDragStart(def)}
                  onclick={() => handleDeviceSelect(def)}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDeviceSelect(def); } }}
                  role="button"
                  tabindex="0"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <!-- Color pill -->
                      <div
                        class="w-2 h-7 rounded-sm flex-shrink-0"
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
                      type="button"
                      class="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-300 transition"
                      title="Add to next available slot in active panel"
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
                  {#if def.terminals.length > 0}
                    <div
                      class="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 font-mono"
                    >
                      <span>{def.terminals.length} Terminals:</span>
                      <span class="truncate">
                        {def.terminals.map((t) => t.label).join(", ")}
                      </span>
                    </div>
                  {/if}
                </div>
              {/each}

              {#if count === 0}
                <div class="text-center py-4 text-xs text-slate-500 italic">
                  No components match in this section.
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}

    {#if isSearching && totalMatchingItems === 0}
      <div class="text-center py-12 px-4 space-y-2 text-slate-500">
        <div class="text-sm font-semibold text-slate-400">No components found</div>
        <p class="text-xs text-slate-500">
          No items match "{searchQuery}". Try searching for generic ratings like "63A", "solar", "RCD", or "inverter".
        </p>
        <button
          type="button"
          class="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition"
          onclick={() => (searchQuery = "")}
        >
          Clear Search
        </button>
      </div>
    {/if}
  </div>

  <!-- Bottom Tip -->
  <div
    class="p-2.5 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60 flex items-center justify-between"
  >
    <div class="truncate">
      <span class="font-semibold text-slate-300">Target:</span>
      <span class="text-blue-400 font-medium ml-1 truncate">"{panelStore.config.name}"</span>
    </div>
    <span class="text-[10px] text-slate-500 font-mono">
      {panelStore.config.rows}R × {panelStore.config.slotsPerRow}M
    </span>
  </div>
</aside>
