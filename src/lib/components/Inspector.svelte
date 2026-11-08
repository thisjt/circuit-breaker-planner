<script lang="ts">
  import { panelStore } from "#lib/state.svelte";
  import { getDeviceDef } from "#lib/catalog";
  import { WIRE_GAUGES, getWireColor } from "#lib/wireStandards";
  import type { WireRole } from "#lib/types";
  import {
    Trash2,
    Settings,
    Sliders,
    Cable,
    Layers,
    ArrowRight,
    HelpCircle,
    Plus,
    Minus,
    ArrowUpDown,
    Square,
    Sun,
    Battery,
    Zap,
    RefreshCw,
    ShieldAlert,
    Cpu,
  } from "@lucide/svelte";

  const selectedDevice = $derived(panelStore.selectedDevice);
  const selectedWire = $derived(panelStore.selectedWire);
  const selectedBusbar = $derived(panelStore.selectedBusbar);
  const selectedEquipment = $derived(panelStore.selectedEquipment);
  const selectedDeviceDef = $derived(
    selectedDevice ? getDeviceDef(selectedDevice.typeId) : undefined,
  );
  const selectedDevicePanel = $derived(
    selectedDevice ? panelStore.getPanelForDevice(selectedDevice.id) : undefined,
  );
  const selectedBusbarPanel = $derived(
    selectedBusbar ? (panelStore.panels.find((p) => p.id === selectedBusbar.panelId) || panelStore.activePanel) : undefined,
  );
  const selectedBatteryWh = $derived(
    selectedEquipment && selectedEquipment.type === 'battery'
      ? (selectedEquipment.whCalculated || Math.round((selectedEquipment.batteryVoltage || 51.2) * (selectedEquipment.capacityAh || 100)))
      : 0
  );

  // Wires connected to current device
  const connectedWires = $derived(
    selectedDevice
      ? panelStore.wires.filter(
          (w) =>
            w.sourceDeviceId === selectedDevice.id ||
            w.targetDeviceId === selectedDevice.id,
        )
      : [],
  );

  // Wires connected to current free equipment
  const connectedEquipmentWires = $derived(
    selectedEquipment
      ? panelStore.wires.filter(
          (w) =>
            w.sourceDeviceId === selectedEquipment.id ||
            w.targetDeviceId === selectedEquipment.id,
        )
      : [],
  );

  // Statistics across all panels
  const totalSlotsCapacity = $derived(
    panelStore.panels.reduce((acc, p) => acc + p.rows * p.slotsPerRow, 0),
  );
  const totalSlotsUsed = $derived(
    panelStore.devices.reduce((acc, d) => acc + d.widthModules, 0),
  );

  function handleRoleChange(newRole: WireRole) {
    if (!selectedWire) return;
    const colorDef = getWireColor(newRole, selectedWire.standard);
    selectedWire.role = newRole;
    selectedWire.color = colorDef.hex;
    panelStore.saveToLocalStorage();
  }

  function handleAddNodeToWire() {
    if (!selectedWire) return;
    const wpList = selectedWire.waypoints || [];
    let newX = 250;
    let newY = 220;
    if (wpList.length > 0) {
      const last = wpList[wpList.length - 1];
      newX = last.x + 40;
      newY = last.y + 40;
    }
    panelStore.addWireWaypoint(selectedWire.id, { x: newX, y: newY });
  }

  function syncSolarPower() {
    if (!selectedEquipment || selectedEquipment.type !== "solar_panel") return;
    const v = selectedEquipment.voltage || 41.5;
    const a = selectedEquipment.current || 13.25;
    selectedEquipment.powerWatts = Math.round(v * a);
    panelStore.saveToLocalStorage();
  }
</script>

<aside
  class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none overflow-y-auto"
>
  <!-- 1. DIN RAIL DEVICE SELECTED -->
  {#if selectedDevice && selectedDeviceDef}
    <div
      class="p-4 border-b border-slate-800 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Sliders class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          {selectedDeviceDef.category === "terminal"
            ? "DIN Terminal Block"
            : "Breaker Properties"}
        </h3>
      </div>
      <button
        class="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
        onclick={() => panelStore.removeDevice(selectedDevice.id)}
        title={selectedDeviceDef.category === "terminal" ? "Delete Terminal" : "Delete Breaker"}
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="p-4 space-y-4 text-xs">
      <div>
        <label class="block font-semibold text-slate-400 mb-1"
          >Component Type</label
        >
        <div
          class="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-slate-200"
        >
          {selectedDeviceDef.name}
          <div class="text-[10px] text-slate-400 mt-0.5">
            {selectedDevice.widthModules} Modules ({selectedDevice.widthModules *
              18}mm) • {selectedDeviceDef.category}
          </div>
        </div>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1"
          >Circuit Tag / Number</label
        >
        <input
          type="text"
          bind:value={selectedDevice.customLabel}
          oninput={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
          placeholder="e.g. Q1, MAIN, MCB-1"
        />
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1"
          >Circuit Description / Room</label
        >
        <input
          type="text"
          bind:value={selectedDevice.circuitDescription}
          oninput={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500"
          placeholder="e.g. Kitchen Outlets, Air Conditioner"
        />
      </div>

      {#if selectedDeviceDef.category !== "terminal" && selectedDeviceDef.category !== "accessory"}
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-slate-400 mb-1"
              >Rated Amps</label
            >
            <input
              type="number"
              bind:value={selectedDevice.ratedAmps}
              oninput={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
            />
          </div>
          {#if selectedDevice.curve}
            <div>
              <label class="block font-semibold text-slate-400 mb-1"
                >Trip Curve</label
              >
              <select
                bind:value={selectedDevice.curve}
                onchange={() => panelStore.saveToLocalStorage()}
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
              >
                <option value="B">B Curve</option>
                <option value="C">C Curve (Standard)</option>
                <option value="D">D Curve (High Inrush)</option>
              </select>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Rail & Panel Position -->
      <div
        class="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2"
      >
        <div class="text-[11px] font-semibold text-slate-400 uppercase">
          Panel Location
        </div>

        {#if panelStore.panels.length > 1}
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5">Breaker Panel</label>
            <select
              value={selectedDevice.panelId || panelStore.panels[0].id}
              onchange={(e) => {
                const newPanelId = (e.target as HTMLSelectElement).value;
                panelStore.moveDevice(
                  selectedDevice.id,
                  0,
                  0,
                  newPanelId
                );
              }}
              class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
            >
              {#each panelStore.panels as p}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5"
              >Rail Row</label
            >
            <select
              value={selectedDevice.railIndex}
              onchange={(e) => {
                const newRow = parseInt((e.target as HTMLSelectElement).value);
                panelStore.moveDevice(
                  selectedDevice.id,
                  newRow,
                  selectedDevice.slotIndex,
                  selectedDevice.panelId,
                );
              }}
              class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
            >
              {#each Array((selectedDevicePanel || panelStore.config).rows) as _, r}
                <option value={r}>Row {r + 1}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5"
              >Start Slot</label
            >
            <input
              type="number"
              min="1"
              max={(selectedDevicePanel || panelStore.config).slotsPerRow -
                selectedDevice.widthModules +
                1}
              value={selectedDevice.slotIndex + 1}
              onchange={(e) => {
                const newSlot =
                  parseInt((e.target as HTMLInputElement).value) - 1;
                panelStore.moveDevice(
                  selectedDevice.id,
                  selectedDevice.railIndex,
                  newSlot,
                  selectedDevice.panelId,
                );
              }}
              class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Connected Wires List -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="font-semibold text-slate-400">
            Connected Wires ({connectedWires.length})
          </label>
        </div>

        {#if connectedWires.length === 0}
          <div class="text-[11px] text-slate-500 italic">
            No wires connected to this device. Click on terminal pins to wire.
          </div>
        {:else}
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {#each connectedWires as wire}
              {@const isSource = wire.sourceDeviceId === selectedDevice.id}
              {@const otherEnd = isSource
                ? `${wire.targetDeviceId}:${wire.targetTerminalId}`
                : `${wire.sourceDeviceId}:${wire.sourceTerminalId}`}
              {@const myTerminal = isSource
                ? wire.sourceTerminalId
                : wire.targetTerminalId}

              <div
                class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full inline-block border border-black/40 flex-shrink-0"
                    style="background-color: {wire.color};"
                  ></span>
                  <div class="font-mono text-[11px]">
                    <span class="text-blue-400 font-bold">{myTerminal}</span>
                    <span class="text-slate-500">→</span>
                    <span class="text-slate-300">{otherEnd}</span>
                  </div>
                </div>
                <button
                  class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 transition"
                  onclick={() => panelStore.removeWire(wire.id)}
                  title="Remove this wire"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  <!-- 2. WIRE CONNECTION SELECTED -->
  {:else if selectedWire}
    <div
      class="p-4 border-b border-slate-800 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Cable class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          Wire Properties
        </h3>
      </div>
      <button
        class="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
        onclick={() => panelStore.removeWire(selectedWire.id)}
        title="Delete Wire"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="p-4 space-y-4 text-xs">
      <div>
        <label class="block font-semibold text-slate-400 mb-1">Wire Role / Phase</label>
        <select
          value={selectedWire.role}
          onchange={(e) =>
            handleRoleChange(
              (e.target as HTMLSelectElement).value as WireRole,
            )}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500"
        >
          <option value="line1">L1 / Hot 1</option>
          <option value="line2">L2 / Hot 2</option>
          <option value="line3">L3 / Hot 3</option>
          <option value="neutral">Neutral (N)</option>
          <option value="earth">Protective Earth (Ground)</option>
          <option value="dc_pos">DC (+) / Solar / Battery</option>
          <option value="dc_neg">DC (-) / Ground Return</option>
          <option value="signal">Control / Signal</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1"
          >Cross-Section / Gauge</label
        >
        <select
          bind:value={selectedWire.gaugeMetric}
          onchange={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
        >
          {#each WIRE_GAUGES as g}
            <option value={g.metric}
              >{g.metric} mm² ({g.awg}) — Max {g.maxAmps}A</option
            >
          {/each}
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Routing Mode</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="py-2 rounded-lg border font-semibold {selectedWire.routingMode ===
            'orthogonal'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedWire.routingMode = "orthogonal";
              panelStore.saveToLocalStorage();
            }}
          >
            Orthogonal
          </button>
          <button
            class="py-2 rounded-lg border font-semibold {selectedWire.routingMode ===
            'curved'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedWire.routingMode = "curved";
              panelStore.saveToLocalStorage();
            }}
          >
            Curved (Bezier)
          </button>
        </div>
      </div>

      <!-- Right-Angle Nodes -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <div class="text-[11px] font-semibold text-slate-300">
            Right-Angle Nodes ({selectedWire.waypoints?.length || 0})
          </div>
          <button
            class="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 px-2 py-0.5 rounded transition"
            onclick={handleAddNodeToWire}
          >
            <Plus class="w-3 h-3" />
            <span>Add Node</span>
          </button>
        </div>

        <p class="text-[10px] text-slate-400 leading-relaxed">
          Tip: Double-click wire on canvas to add a node, then drag it.
        </p>

        {#if selectedWire.waypoints && selectedWire.waypoints.length > 0}
          <div class="space-y-1 max-h-32 overflow-y-auto">
            {#each selectedWire.waypoints as wp, idx}
              <div
                class="flex items-center justify-between bg-slate-900 px-2 py-1 rounded text-[11px] font-mono text-slate-300"
              >
                <span>Node {idx + 1}: ({wp.x}, {wp.y})</span>
                <button
                  class="text-red-400 hover:text-red-300 p-0.5"
                  onclick={() =>
                    panelStore.removeWireWaypoint(selectedWire.id, idx)}
                  title="Remove this node"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            {/each}
          </div>
          <button
            class="w-full text-center text-[10px] text-slate-400 hover:text-red-400 pt-1 transition"
            onclick={() => panelStore.clearWireWaypoints(selectedWire.id)}
          >
            Clear All Nodes (Reset Path)
          </button>
        {/if}
      </div>

      <!-- Endpoints Details -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="text-[10px] text-slate-400 uppercase font-bold">
          Connection Endpoints
        </div>
        <div
          class="flex items-center justify-between font-mono text-[11px] text-slate-300"
        >
          <div>
            <div class="text-slate-500 text-[10px]">Source</div>
            <div class="font-bold text-blue-400">
              {selectedWire.sourceDeviceId}
            </div>
            <div class="text-slate-400">
              Terminal: {selectedWire.sourceTerminalId}
            </div>
          </div>
          <ArrowRight class="w-4 h-4 text-slate-600" />
          <div class="text-right">
            <div class="text-slate-500 text-[10px]">Target</div>
            <div class="font-bold text-emerald-400">
              {selectedWire.targetDeviceId}
            </div>
            <div class="text-slate-400">
              Terminal: {selectedWire.targetTerminalId}
            </div>
          </div>
        </div>
      </div>
    </div>

  <!-- 3. COMB BUSBAR SELECTED -->
  {:else if selectedBusbar}
    <div
      class="p-4 border-b border-slate-800 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Layers class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          Comb Busbar
        </h3>
      </div>
      <button
        class="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
        onclick={() => panelStore.removeBusbar(selectedBusbar.id)}
        title="Delete Busbar"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="p-4 space-y-4 text-xs">
      <div>
        <label class="block font-semibold text-slate-400 mb-1">Busbar Type</label>
        <select
          bind:value={selectedBusbar.busbarType}
          onchange={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
        >
          <option value="1P">1-Phase Comb (1P)</option>
          <option value="1P+N">1-Phase + Neutral (1P+N)</option>
          <option value="2P">2-Phase / 230V Delta (2P)</option>
          <option value="3P">3-Phase Comb (3P)</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Terminal Position</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="py-2 rounded-lg border font-semibold {selectedBusbar.position ===
            'top'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedBusbar.position = "top";
              panelStore.saveToLocalStorage();
            }}
          >
            Top Terminals
          </button>
          <button
            class="py-2 rounded-lg border font-semibold {selectedBusbar.position ===
            'bottom'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedBusbar.position = "bottom";
              panelStore.saveToLocalStorage();
            }}
          >
            Bottom Terminals
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block font-semibold text-slate-400 mb-1">Start Slot</label>
          <input
            type="number"
            min="1"
            max={(selectedBusbarPanel || panelStore.config).slotsPerRow}
            value={selectedBusbar.startSlot + 1}
            onchange={(e) => {
              selectedBusbar.startSlot = Math.max(
                0,
                parseInt((e.target as HTMLInputElement).value) - 1,
              );
              panelStore.saveToLocalStorage();
            }}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
          />
        </div>
        <div>
          <label class="block font-semibold text-slate-400 mb-1">Span (Modules)</label>
          <input
            type="number"
            min="2"
            max={(selectedBusbarPanel || panelStore.config).slotsPerRow - selectedBusbar.startSlot}
            bind:value={selectedBusbar.slotSpan}
            onchange={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
          />
        </div>
      </div>
    </div>

  <!-- 4. FREE-PLACE EQUIPMENT SELECTED (SOLAR, BATTERY, MCCB, INVERTERS, FIELD BLOCK) -->
  {:else if selectedEquipment}
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        {#if selectedEquipment.type === 'solar_panel'}
          <Sun class="w-4 h-4 text-amber-400" />
        {:else if selectedEquipment.type === 'battery'}
          <Battery class="w-4 h-4 text-emerald-400" />
        {:else if selectedEquipment.type === 'mccb'}
          <ShieldAlert class="w-4 h-4 text-orange-400" />
        {:else if selectedEquipment.type === 'hybrid_inverter'}
          <Zap class="w-4 h-4 text-blue-400" />
        {:else if selectedEquipment.type === 'offgrid_inverter'}
          <Cpu class="w-4 h-4 text-cyan-400" />
        {:else}
          <Square class="w-4 h-4 text-amber-400" />
        {/if}
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          {selectedEquipment.type === 'solar_panel'
            ? 'Solar Panel'
            : selectedEquipment.type === 'battery'
              ? 'Battery Bank'
              : selectedEquipment.type === 'mccb'
                ? 'Industrial MCCB'
                : selectedEquipment.type === 'hybrid_inverter'
                  ? 'Hybrid Inverter'
                  : selectedEquipment.type === 'offgrid_inverter'
                    ? 'Off-Grid Inverter'
                    : 'Field Connection Block'}
        </h3>
      </div>
      <button
        class="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
        onclick={() => panelStore.removeEquipment(selectedEquipment.id)}
        title="Delete Equipment"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="p-4 space-y-4 text-xs">
      <div>
        <label class="block font-semibold text-slate-400 mb-1">Equipment Label</label>
        <input
          type="text"
          bind:value={selectedEquipment.label}
          oninput={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-bold text-sm"
        />
      </div>

      <!-- SOLAR PANEL AUTHORING -->
      {#if selectedEquipment.type === 'solar_panel'}
        <div class="bg-amber-950/20 border border-amber-600/30 p-2.5 rounded-xl text-amber-300 text-[11px]">
          Authorable Photovoltaic specifications. Power is auto-calculable ($P = V \times I$).
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-amber-400 mb-1">Voltage Vmp (V)</label>
            <input
              type="number"
              step="0.1"
              bind:value={selectedEquipment.voltage}
              oninput={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
            />
          </div>
          <div>
            <label class="block font-semibold text-amber-400 mb-1">Current Imp (A)</label>
            <input
              type="number"
              step="0.05"
              bind:value={selectedEquipment.current}
              oninput={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-semibold text-amber-400">Rated Power (Watts)</label>
            <button
              class="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
              onclick={syncSolarPower}
              title="Calculate Power = Voltage × Current"
            >
              <RefreshCw class="w-3 h-3" />
              <span>Calc from V×I ({Math.round((selectedEquipment.voltage || 41.5) * (selectedEquipment.current || 13.25))}W)</span>
            </button>
          </div>
          <input
            type="number"
            step="5"
            bind:value={selectedEquipment.powerWatts}
            oninput={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-amber-500/60 rounded-lg p-2 text-slate-100 outline-none font-mono font-bold text-base"
          />
        </div>

      <!-- BATTERY AUTHORING -->
      {:else if selectedEquipment.type === 'battery'}
        <div class="bg-emerald-950/20 border border-emerald-600/30 p-2.5 rounded-xl text-emerald-300 text-[11px]">
          Authorable battery voltage & Ah. Wh and kWh are <span class="font-bold underline">auto-calculated</span>.
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-emerald-400 mb-1">Voltage (V)</label>
            <select
              bind:value={selectedEquipment.batteryVoltage}
              onchange={() => {
                panelStore.updateEquipment(selectedEquipment.id, { batteryVoltage: selectedEquipment.batteryVoltage });
              }}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
            >
              <option value={12}>12V</option>
              <option value={24}>24V</option>
              <option value={48}>48V</option>
              <option value={51.2}>51.2V (LiFePO4)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-emerald-400 mb-1">Capacity (Ah)</label>
            <input
              type="number"
              step="10"
              bind:value={selectedEquipment.capacityAh}
              oninput={() => {
                panelStore.updateEquipment(selectedEquipment.id, { capacityAh: selectedEquipment.capacityAh });
              }}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono font-bold"
            />
          </div>
        </div>

        <!-- Autocalculate Wh Display Readout -->
        <div class="bg-slate-950 p-3 rounded-xl border border-emerald-500/50 space-y-1">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">
            Auto-Calculated Energy Storage:
          </div>
          <div class="text-lg font-mono font-black text-emerald-400">
            {(selectedBatteryWh / 1000).toFixed(2)} kWh
            <span class="text-xs text-slate-400 font-normal">({selectedBatteryWh} Wh)</span>
          </div>
          <div class="text-[10px] text-slate-500 font-mono">
            Formula: {selectedEquipment.batteryVoltage || 51.2}V × {selectedEquipment.capacityAh || 100}Ah = {selectedBatteryWh}Wh
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Battery Chemistry</label>
          <select
            bind:value={selectedEquipment.chemistry}
            onchange={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
          >
            <option value="LiFePO4">Lithium Iron Phosphate (LiFePO4)</option>
            <option value="Lithium-Ion">Ternary Lithium-Ion (NMC)</option>
            <option value="Lead-Acid">Deep Cycle Lead-Acid / AGM</option>
          </select>
        </div>

      <!-- MCCB AUTHORING -->
      {:else if selectedEquipment.type === 'mccb'}
        <div class="bg-orange-950/20 border border-orange-600/30 p-2.5 rounded-xl text-orange-300 text-[11px]">
          Authorable industrial molded case breaker current & poles.
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-orange-400 mb-1">Rated Current (A)</label>
            <select
              bind:value={selectedEquipment.ratedAmps}
              onchange={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono font-bold"
            >
              <option value={63}>63A</option>
              <option value={100}>100A</option>
              <option value={125}>125A</option>
              <option value={160}>160A</option>
              <option value={200}>200A</option>
              <option value={250}>250A</option>
              <option value={400}>400A</option>
              <option value={630}>630A</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-orange-400 mb-1">Poles</label>
            <select
              bind:value={selectedEquipment.poles}
              onchange={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
            >
              <option value={2}>2-Pole (Single Phase)</option>
              <option value={3}>3-Pole (Three Phase)</option>
              <option value={4}>4-Pole (3P + N)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Breaking Capacity (kA)</label>
          <input
            type="number"
            bind:value={selectedEquipment.breakingCapacityKa}
            oninput={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
          />
        </div>

      <!-- HYBRID INVERTER AUTHORING -->
      {:else if selectedEquipment.type === 'hybrid_inverter'}
        <div class="bg-blue-950/20 border border-blue-600/30 p-2.5 rounded-xl text-blue-300 text-[11px]">
          Hybrid Inverter with bidirectional Grid AC In, Load AC Out, Battery In/Out, and Solar PV In.
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-blue-400 mb-1">Capacity (kW)</label>
            <select
              bind:value={selectedEquipment.capacityKw}
              onchange={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono font-bold text-sm"
            >
              <option value={3.6}>3.6 kW</option>
              <option value={5}>5.0 kW</option>
              <option value={6}>6.0 kW</option>
              <option value={8}>8.0 kW</option>
              <option value={10}>10.0 kW</option>
              <option value={12}>12.0 kW</option>
              <option value={15}>15.0 kW</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-blue-400 mb-1">Battery DC (V)</label>
            <select
              bind:value={selectedEquipment.systemVoltage}
              onchange={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
            >
              <option value={48}>48V Nominal</option>
              <option value={24}>24V Nominal</option>
            </select>
          </div>
        </div>

      <!-- OFFGRID INVERTER AUTHORING -->
      {:else if selectedEquipment.type === 'offgrid_inverter'}
        <div class="bg-cyan-950/20 border border-cyan-600/30 p-2.5 rounded-xl text-cyan-300 text-[11px]">
          Offgrid Inverter with standalone AC Load Out, Battery In/Out, and Solar PV In.
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-cyan-400 mb-1">Capacity (kW)</label>
            <select
              bind:value={selectedEquipment.capacityKw}
              onchange={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono font-bold text-sm"
            >
              <option value={2.4}>2.4 kW</option>
              <option value={3}>3.0 kW</option>
              <option value={5}>5.0 kW</option>
              <option value={7.2}>7.2 kW</option>
              <option value={11}>11.0 kW</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-cyan-400 mb-1">Battery Voltage</label>
            <select
              bind:value={selectedEquipment.systemVoltage}
              onchange={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
            >
              <option value={48}>48V Battery</option>
              <option value={24}>24V Battery</option>
            </select>
          </div>
        </div>

      <!-- FIELD BLOCK -->
      {:else}
        <div>
          <label class="block font-semibold text-amber-400 mb-1">Destination / Label</label>
          <input
            type="text"
            bind:value={selectedEquipment.label}
            oninput={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-amber-500/60 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-400 font-bold"
            placeholder="e.g. From House, To Airconditioner"
          />
        </div>
      {/if}

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Circuit / Description</label>
        <input
          type="text"
          bind:value={selectedEquipment.description}
          oninput={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500"
          placeholder="e.g. 230V 2-Wire, 1.5HP AC"
        />
      </div>

      <!-- Canvas Position -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="text-[10px] font-semibold text-slate-400 uppercase">
          Canvas Coordinates (Drag or Tweak)
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5">X (px)</label>
            <input
              type="number"
              step="5"
              bind:value={selectedEquipment.x}
              oninput={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none font-mono"
            />
          </div>
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5">Y (px)</label>
            <input
              type="number"
              step="5"
              bind:value={selectedEquipment.y}
              oninput={() => panelStore.saveToLocalStorage()}
              class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      <!-- Connected Wires -->
      <div>
        <div class="text-[10px] font-semibold text-slate-400 mb-1">
          Connected Wires ({connectedEquipmentWires.length})
        </div>
        {#if connectedEquipmentWires.length === 0}
          <div class="text-[11px] text-slate-500 italic py-1">
            No wires attached yet. Click on terminal ports to connect.
          </div>
        {:else}
          <div class="space-y-1.5 max-h-36 overflow-y-auto">
            {#each connectedEquipmentWires as wire}
              {@const isSource = wire.sourceDeviceId === selectedEquipment.id}
              {@const localTerm = isSource ? wire.sourceTerminalId : wire.targetTerminalId}
              {@const remoteDev = isSource ? wire.targetDeviceId : wire.sourceDeviceId}
              {@const remoteTerm = isSource ? wire.targetTerminalId : wire.sourceTerminalId}
              <div class="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded text-[11px] border border-slate-800">
                <div class="flex items-center gap-1.5">
                  <span
                    class="w-2.5 h-2.5 rounded-full inline-block border border-black/40 flex-shrink-0"
                    style="background-color: {wire.color};"
                  ></span>
                  <span class="font-mono text-slate-300">{localTerm} → {remoteDev}:{remoteTerm}</span>
                  <span class="text-slate-500 text-[10px]">({wire.gaugeMetric}mm²)</span>
                </div>
                <button
                  class="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-slate-800"
                  onclick={() => panelStore.removeWire(wire.id)}
                  title="Disconnect wire"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  <!-- 5. PANEL SETTINGS (WHEN PANEL IS SELECTED OR NO SELECTION) -->
  {:else}
    {@const activeP = panelStore.activePanel}

    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Settings class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          Panel & System Setup
        </h3>
      </div>
      {#if panelStore.panels.length > 1}
        <button
          class="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
          onclick={() => panelStore.removePanel(activeP.id)}
          title="Delete this Panel"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      {/if}
    </div>

    <div class="p-4 space-y-4 text-xs">
      <!-- Multi-panel selector tabs -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-slate-400">
          <label class="font-semibold text-slate-300">Select Active Panel ({panelStore.panels.length})</label>
          <button
            class="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded"
            onclick={() => panelStore.addPanel()}
          >
            <Plus class="w-3 h-3" />
            <span>Add Panel</span>
          </button>
        </div>

        <div class="flex flex-col gap-1.5">
          {#each panelStore.panels as p}
            <button
              class="px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition {panelStore.activePanelId === p.id
                ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
              onclick={() => {
                panelStore.setActivePanel(p.id);
                panelStore.select('panel', p.id);
              }}
            >
              <div class="truncate">
                ⚡ {p.name}
              </div>
              <div class="text-[10px] font-mono text-slate-400">
                {p.slotsPerRow}M × {p.rows}R
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Capacity stats -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="flex justify-between items-center text-slate-400">
          <span>Total DIN Utilization</span>
          <span class="font-mono font-bold text-slate-200">
            {totalSlotsUsed} / {totalSlotsCapacity} TE
          </span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 rounded-full transition-all"
            style="width: {Math.min(
              100,
              (totalSlotsUsed / (totalSlotsCapacity || 1)) * 100,
            )}%;"
          ></div>
        </div>
        <div class="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>{panelStore.panels.length} Panels</span>
          <span>{panelStore.devices.length} Breakers</span>
          <span>{panelStore.equipment.length} Equipment</span>
        </div>
      </div>

      <!-- Active Panel Configuration -->
      <div class="pt-2 border-t border-slate-800 space-y-3">
        <div class="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
          Configuring: {activeP.name}
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Panel Name</label>
          <input
            type="text"
            bind:value={activeP.name}
            oninput={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-bold"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">DIN Rail Rows (Tiers)</label>
          <input
            type="number"
            min="1"
            max="6"
            bind:value={activeP.rows}
            onchange={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Modules per Rail (Slots / Row)</label>
          <input
            type="number"
            min="4"
            max="36"
            bind:value={activeP.slotsPerRow}
            onchange={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
          />
        </div>

        <!-- Rail Spacing -->
        <div class="space-y-2 pt-2 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-1.5 font-semibold text-slate-300">
              <ArrowUpDown class="w-3.5 h-3.5 text-blue-400" />
              <span>Distance Between Rails</span>
            </label>
            <span class="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
              {activeP.railSpacing || 230} px
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-lg transition text-xs flex items-center gap-1"
              onclick={() => panelStore.adjustRailSpacing(-10)}
            >
              <Minus class="w-3 h-3" />
              <span>10</span>
            </button>

            <input
              type="range"
              min="180"
              max="380"
              step="5"
              value={activeP.railSpacing || 230}
              oninput={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value);
                panelStore.setRailSpacing(val);
              }}
              class="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            <button
              class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-lg transition text-xs flex items-center gap-1"
              onclick={() => panelStore.adjustRailSpacing(10)}
            >
              <Plus class="w-3 h-3" />
              <span>10</span>
            </button>
          </div>
        </div>

        <!-- Busbar Strips -->
        <div class="space-y-2 pt-2 border-t border-slate-800">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={activeP.hasGroundBar}
              onchange={() => panelStore.saveToLocalStorage()}
              class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span class="font-semibold text-slate-300">Top Ground (PE) Brass Bar</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={activeP.hasNeutralBar}
              onchange={() => panelStore.saveToLocalStorage()}
              class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span class="font-semibold text-slate-300">Bottom Neutral (N) Brass Bar</span>
          </label>
        </div>

        <!-- Canvas Position -->
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div class="text-[10px] font-semibold text-slate-400 uppercase">
            Panel Canvas Position
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-slate-500 mb-0.5">X Position</label>
              <input
                type="number"
                step="20"
                bind:value={activeP.x}
                oninput={() => panelStore.saveToLocalStorage()}
                class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 mb-0.5">Y Position</label>
              <input
                type="number"
                step="20"
                bind:value={activeP.y}
                oninput={() => panelStore.saveToLocalStorage()}
                class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Philippine Standard Guide -->
      <div
        class="bg-blue-950/30 border border-blue-900/50 p-3 rounded-xl text-[11px] text-blue-300/90 leading-relaxed"
      >
        <div class="flex items-center gap-1.5 font-bold text-blue-200 mb-1">
          <HelpCircle class="w-3.5 h-3.5 text-blue-400" />
          Multi-Panel Planning
        </div>
        You can place and interconnect multiple breaker panels on this canvas (e.g. Main Distribution Panel + Sub-Panels + Inverters). Drag panels by their top header bar to arrange them.
      </div>
    </div>
  {/if}
</aside>
