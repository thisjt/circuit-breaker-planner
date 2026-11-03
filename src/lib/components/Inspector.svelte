<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import { WIRE_GAUGES, getWireColor } from '#lib/wireStandards';
  import type { WireRole } from '#lib/types';
  import {
    Trash2,
    Settings,
    Sliders,
    Cable,
    Layers,
    ArrowRight,
    HelpCircle
  } from '@lucide/svelte';

  const selectedDevice = $derived(panelStore.selectedDevice);
  const selectedWire = $derived(panelStore.selectedWire);
  const selectedBusbar = $derived(panelStore.selectedBusbar);
  const selectedDeviceDef = $derived(
    selectedDevice ? getDeviceDef(selectedDevice.typeId) : undefined
  );

  // Wires connected to current device
  const connectedWires = $derived(
    selectedDevice
      ? panelStore.wires.filter(
          (w) =>
            w.sourceDeviceId === selectedDevice.id ||
            w.targetDeviceId === selectedDevice.id
        )
      : []
  );

  // Statistics
  const totalSlotsCapacity = $derived(
    panelStore.config.rows * panelStore.config.slotsPerRow
  );
  const totalSlotsUsed = $derived(
    panelStore.devices.reduce((acc, d) => acc + d.widthModules, 0)
  );

  function handleRoleChange(newRole: WireRole) {
    if (!selectedWire) return;
    const colorDef = getWireColor(newRole, selectedWire.standard);
    selectedWire.role = newRole;
    selectedWire.color = colorDef.hex;
    panelStore.saveToLocalStorage();
  }
</script>

<aside class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none overflow-y-auto">
  <!-- DEVICE SELECTED -->
  {#if selectedDevice && selectedDeviceDef}
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Sliders class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          Breaker Properties
        </h3>
      </div>
      <button
        class="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
        onclick={() => panelStore.removeDevice(selectedDevice.id)}
        title="Delete Breaker"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="p-4 space-y-4 text-xs">
      <div>
        <label class="block font-semibold text-slate-400 mb-1">Component Type</label>
        <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-slate-200">
          {selectedDeviceDef.name}
          <div class="text-[10px] text-slate-400 mt-0.5">
            {selectedDevice.widthModules} Modules ({selectedDevice.widthModules * 18}mm) • {selectedDeviceDef.category}
          </div>
        </div>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Circuit Tag / Number</label>
        <input
          type="text"
          bind:value={selectedDevice.customLabel}
          oninput={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
          placeholder="e.g. Q1, MAIN, MCB-1"
        />
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Circuit Description / Room</label>
        <input
          type="text"
          bind:value={selectedDevice.circuitDescription}
          oninput={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500"
          placeholder="e.g. Kitchen Outlets, Air Conditioner"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block font-semibold text-slate-400 mb-1">Rated Amps</label>
          <input
            type="number"
            bind:value={selectedDevice.ratedAmps}
            oninput={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
          />
        </div>
        {#if selectedDevice.curve}
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Trip Curve</label>
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

      <!-- Rail & Slot Position -->
      <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="text-[11px] font-semibold text-slate-400 uppercase">Rail Location</div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5">Rail Row</label>
            <select
              value={selectedDevice.railIndex}
              onchange={(e) => {
                const newRow = parseInt((e.target as HTMLSelectElement).value);
                panelStore.moveDevice(selectedDevice.id, newRow, selectedDevice.slotIndex);
              }}
              class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
            >
              {#each Array(panelStore.config.rows) as _, r}
                <option value={r}>Row {r + 1}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-[10px] text-slate-500 mb-0.5">Start Slot</label>
            <input
              type="number"
              min="1"
              max={panelStore.config.slotsPerRow - selectedDevice.widthModules + 1}
              value={selectedDevice.slotIndex + 1}
              onchange={(e) => {
                const newSlot = parseInt((e.target as HTMLInputElement).value) - 1;
                panelStore.moveDevice(selectedDevice.id, selectedDevice.railIndex, newSlot);
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
        {#if connectedWires.length > 0}
          <div class="space-y-1.5 max-h-40 overflow-y-auto">
            {#each connectedWires as w}
              {@const isSrc = w.sourceDeviceId === selectedDevice.id}
              {@const termLabel = isSrc ? w.sourceTerminalId : w.targetTerminalId}
              {@const otherDevId = isSrc ? w.targetDeviceId : w.sourceDeviceId}
              {@const otherTermId = isSrc ? w.targetTerminalId : w.sourceTerminalId}
              {@const otherDev = panelStore.devices.find((d) => d.id === otherDevId)}
              <div
                class="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-2.5 h-2.5 rounded-full"
                    style="background-color: {w.color};"
                  ></div>
                  <div class="font-mono text-[11px]">
                    <span class="text-blue-400 font-bold">{termLabel}</span>
                    <span class="text-slate-500 mx-1">→</span>
                    <span class="text-slate-300">
                      {otherDev ? otherDev.customLabel : otherDevId} ({otherTermId})
                    </span>
                  </div>
                </div>
                <button
                  class="text-slate-500 hover:text-red-400 p-1 transition"
                  onclick={() => panelStore.removeWire(w.id)}
                  title="Remove Wire"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-[11px] text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-800">
            No wires connected yet. Switch to Wire Tool to link terminals.
          </div>
        {/if}
      </div>
    </div>

  <!-- WIRE SELECTED -->
  {:else}
    {#if selectedWire}
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Cable class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          Wire Connection
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
        <label class="block font-semibold text-slate-400 mb-1">Conductor Role / Phase</label>
        <select
          value={selectedWire.role}
          onchange={(e) => handleRoleChange((e.target as HTMLSelectElement).value as WireRole)}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500"
        >
          <option value="line1">L1 / Hot 1</option>
          <option value="line2">L2 / Hot 2</option>
          <option value="line3">L3 / Hot 3</option>
          <option value="neutral">Neutral (N)</option>
          <option value="earth">Protective Earth (Ground)</option>
          <option value="dc_pos">DC (+)</option>
          <option value="dc_neg">DC (-)</option>
          <option value="signal">Control / Signal</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Cross-Section / Gauge</label>
        <select
          bind:value={selectedWire.gaugeMetric}
          onchange={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 font-mono"
        >
          {#each WIRE_GAUGES as g}
            <option value={g.metric}>{g.metric} mm² ({g.awg}) — Max {g.maxAmps}A</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">Routing Mode</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="py-2 rounded-lg border font-semibold {selectedWire.routingMode === 'curved' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedWire.routingMode = 'curved';
              panelStore.saveToLocalStorage();
            }}
          >
            Curved (Bezier)
          </button>
          <button
            class="py-2 rounded-lg border font-semibold {selectedWire.routingMode === 'orthogonal' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedWire.routingMode = 'orthogonal';
              panelStore.saveToLocalStorage();
            }}
          >
            Orthogonal (Duct)
          </button>
        </div>
      </div>

      <!-- Endpoints Details -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="text-[10px] text-slate-400 uppercase font-bold">Connection Endpoints</div>
        <div class="flex items-center justify-between font-mono text-[11px] text-slate-300">
          <div>
            <div class="text-slate-500 text-[10px]">Source</div>
            <div class="font-bold text-blue-400">{selectedWire.sourceDeviceId}</div>
            <div class="text-slate-400">Terminal: {selectedWire.sourceTerminalId}</div>
          </div>
          <ArrowRight class="w-4 h-4 text-slate-600" />
          <div class="text-right">
            <div class="text-slate-500 text-[10px]">Target</div>
            <div class="font-bold text-emerald-400">{selectedWire.targetDeviceId}</div>
            <div class="text-slate-400">Terminal: {selectedWire.targetTerminalId}</div>
          </div>
        </div>
      </div>
    </div>

  <!-- COMB BUSBAR SELECTED -->
  {:else if selectedBusbar}
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
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
            class="py-2 rounded-lg border font-semibold {selectedBusbar.position === 'top' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedBusbar.position = 'top';
              panelStore.saveToLocalStorage();
            }}
          >
            Top Terminals
          </button>
          <button
            class="py-2 rounded-lg border font-semibold {selectedBusbar.position === 'bottom' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}"
            onclick={() => {
              selectedBusbar.position = 'bottom';
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
            max={panelStore.config.slotsPerRow}
            value={selectedBusbar.startSlot + 1}
            onchange={(e) => {
              selectedBusbar.startSlot = Math.max(0, parseInt((e.target as HTMLInputElement).value) - 1);
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
            max={panelStore.config.slotsPerRow - selectedBusbar.startSlot}
            bind:value={selectedBusbar.slotSpan}
            onchange={() => panelStore.saveToLocalStorage()}
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
          />
        </div>
      </div>
    </div>

  <!-- NO SELECTION: PANEL SETTINGS -->
  {:else}
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Settings class="w-4 h-4 text-blue-400" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-100">
          Enclosure Settings
        </h3>
      </div>
    </div>

    <div class="p-4 space-y-4 text-xs">
      <!-- Capacity stats -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="flex justify-between items-center text-slate-400">
          <span>DIN Module Utilization</span>
          <span class="font-mono font-bold text-slate-200">
            {totalSlotsUsed} / {totalSlotsCapacity} TE
          </span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 rounded-full transition-all"
            style="width: {Math.min(100, (totalSlotsUsed / totalSlotsCapacity) * 100)}%;"
          ></div>
        </div>
        <div class="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>{panelStore.devices.length} Devices</span>
          <span>{panelStore.wires.length} Wires</span>
          <span>{panelStore.busbars.length} Busbars</span>
        </div>
      </div>

      <div>
        <label class="block font-semibold text-slate-400 mb-1">DIN Rail Rows (Tiers)</label>
        <input
          type="number"
          min="1"
          max="6"
          bind:value={panelStore.config.rows}
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
          bind:value={panelStore.config.slotsPerRow}
          onchange={() => panelStore.saveToLocalStorage()}
          class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none font-mono"
        />
      </div>

      <div class="space-y-2 pt-2 border-t border-slate-800">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={panelStore.config.hasGroundBar}
            onchange={() => panelStore.saveToLocalStorage()}
            class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
          />
          <span class="font-semibold text-slate-300">Top Ground (PE) Brass Bar</span>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={panelStore.config.hasNeutralBar}
            onchange={() => panelStore.saveToLocalStorage()}
            class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
          />
          <span class="font-semibold text-slate-300">Bottom Neutral (N) Brass Bar</span>
        </label>
      </div>

      <!-- Philippine Standard Guide -->
      <div class="bg-blue-950/30 border border-blue-900/50 p-3 rounded-xl text-[11px] text-blue-300/90 leading-relaxed">
        <div class="flex items-center gap-1.5 font-bold text-blue-200 mb-1">
          <HelpCircle class="w-3.5 h-3.5 text-blue-400" />
          Philippine Standard (PEC)
        </div>
        Residential feeds are typically 230V 2-wire Delta (Black & Red) or 230V L-N (Black & White). Grounding (PE) is always Green or Green/Yellow.
      </div>
    </div>
    {/if}
  {/if}
</aside>

