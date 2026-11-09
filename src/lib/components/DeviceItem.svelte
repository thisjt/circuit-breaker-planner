<script lang="ts">
  import type { PlacedDevice, TerminalDef } from "#lib/types";
  import { getDeviceDef } from "#lib/catalog";
  import { panelStore } from "#lib/state.svelte";

  // Standard fallback faceplate
  import StandardBreakerFaceplate from "./categories/shared/StandardBreakerFaceplate.svelte";

  // 1. Main Switches & Isolators
  import MainSwitch2P63A from "./categories/main-switches-and-isolators/2-pole-63a-main-switch.svelte";
  import MainSwitch2P100A from "./categories/main-switches-and-isolators/2-pole-100a-main-switch.svelte";
  import MainSwitch4P63A from "./categories/main-switches-and-isolators/4-pole-63a-main-switch.svelte";

  // 2. RCD / RCCB Safety Switches
  import Rcd2P40A30mA from "./categories/rcd-rccb-safety-switches/2-pole-40a-30ma-rcd.svelte";
  import Rcd2P63A30mA from "./categories/rcd-rccb-safety-switches/2-pole-63a-30ma-rcd.svelte";

  // 3. RCBO Residual & Overcurrent
  import Rcbo1PCompact16A from "./categories/rcbo-residual-and-overcurrent/1p-n-compact-16a-30ma-rcbo.svelte";
  import Rcbo1PCompact20A from "./categories/rcbo-residual-and-overcurrent/1p-n-compact-20a-30ma-rcbo.svelte";
  import Rcbo2P32A30mA from "./categories/rcbo-residual-and-overcurrent/2-pole-2-wide-32a-30ma-rcbo.svelte";

  // 4. MCB Circuit Breakers
  import Mcb1P16A from "./categories/mcb-circuit-breakers/1-pole-16a-mcb.svelte";
  import Mcb1P20A from "./categories/mcb-circuit-breakers/1-pole-20a-mcb.svelte";
  import Mcb1P32A from "./categories/mcb-circuit-breakers/1-pole-32a-mcb.svelte";
  import Mcb2P20A from "./categories/mcb-circuit-breakers/2-pole-20a-mcb.svelte";
  import Mcb2P32A from "./categories/mcb-circuit-breakers/2-pole-32a-mcb.svelte";
  import Mcb3P32A from "./categories/mcb-circuit-breakers/3-pole-32a-mcb.svelte";

  // 5. Surge Protective Devices (SPD)
  import Spd2PT2 from "./categories/surge-protective-devices-spd/2-pole-type-2-spd.svelte";

  // 6. Transfer Switches (ATS / MTS)
  import Mts2P63A from "./categories/transfer-switches-ats-mts/manual-transfer-switch-mts-63a.svelte";
  import Ats2P100A from "./categories/transfer-switches-ats-mts/automatic-transfer-switch-ats-100a.svelte";

  // 7. Smart Relays & Energy Meters
  import ShellySmartRelay1M from "./categories/smart-relays-and-energy-meters/smart-din-relay-shelly.svelte";
  import DigitalEnergyMeter2P from "./categories/smart-relays-and-energy-meters/digital-energy-meter-2p-2-module.svelte";
  import DigitalEnergyMeter2P1M from "./categories/smart-relays-and-energy-meters/digital-energy-meter-2p-1-module-compact.svelte";
  import DigitalEnergyMeter1M from "./categories/smart-relays-and-energy-meters/digital-energy-meter-1p-compact.svelte";

  // 8. Terminals & Field Blocks
  import TerminalDist1In4Out from "./categories/terminals-and-field-blocks/1-in-4-out-terminal-block.svelte";
  import Terminal3In3Out1M from "./categories/terminals-and-field-blocks/3-in-3-out-terminal-block.svelte";
  import TerminalPassthrough1M from "./categories/terminals-and-field-blocks/1-module-feed-through-block.svelte";

  // 9. Accessories & Hardware
  import BlankingPlate1M from "./categories/accessories-and-hardware/blanking-plate-1-module.svelte";

  interface Props {
    device: PlacedDevice;
    x: number;
    y: number;
    moduleWidthPx?: number;
    heightPx?: number;
    onTerminalMouseDown?: (
      deviceId: string,
      terminalId: string,
      event: MouseEvent,
    ) => void;
    onTerminalMouseUp?: (
      deviceId: string,
      terminalId: string,
      event: MouseEvent,
    ) => void;
  }

  let {
    device,
    x,
    y,
    moduleWidthPx = 44,
    heightPx = 160,
    onTerminalMouseDown,
    onTerminalMouseUp,
  }: Props = $props();

  const DIN_COMPONENTS: Record<string, any> = {
    "isolator-2p-63a": MainSwitch2P63A,
    "isolator-2p-100a": MainSwitch2P100A,
    "isolator-4p-63a": MainSwitch4P63A,
    "rcd-2p-40a-30ma": Rcd2P40A30mA,
    "rcd-2p-63a-30ma": Rcd2P63A30mA,
    "rcbo-1p-compact-16a": Rcbo1PCompact16A,
    "rcbo-1p-compact-20a": Rcbo1PCompact20A,
    "rcbo-2p-32a-30ma": Rcbo2P32A30mA,
    "mcb-1p-16a": Mcb1P16A,
    "mcb-1p-20a": Mcb1P20A,
    "mcb-1p-32a": Mcb1P32A,
    "mcb-2p-20a": Mcb2P20A,
    "mcb-2p-32a": Mcb2P32A,
    "mcb-3p-32a": Mcb3P32A,
    "spd-2p-t2": Spd2PT2,
    "mts-2p-63a": Mts2P63A,
    "ats-2p-100a": Ats2P100A,
    "shelly-smart-relay-1m": ShellySmartRelay1M,
    "energy-meter-2p": DigitalEnergyMeter2P,
    "energy-meter-2p-1m": DigitalEnergyMeter2P1M,
    "energy-meter-1m": DigitalEnergyMeter1M,
    "terminal-dist-1in4out": TerminalDist1In4Out,
    "terminal-3in3out-1m": Terminal3In3Out1M,
    "terminal-passthrough-1m": TerminalPassthrough1M,
    "blank-plate-1m": BlankingPlate1M,
  };

  const def = $derived(getDeviceDef(device.typeId));
  const isSelected = $derived(
    panelStore.selectedType === "device" && panelStore.selectedId === device.id,
  );

  const totalWidth = $derived(device.widthModules * moduleWidthPx);
  const poles = $derived(def?.poles || 1);

  const ActiveFaceplate = $derived(
    DIN_COMPONENTS[device.typeId] || StandardBreakerFaceplate,
  );

  // Group terminals by top and bottom
  const topTerminals = $derived(
    def?.terminals.filter((t) => t.position === "top") || [],
  );
  const bottomTerminals = $derived(
    def?.terminals.filter((t) => t.position === "bottom") || [],
  );

  function handleDeviceClick(e: MouseEvent) {
    e.stopPropagation();
    if (panelStore.activeTool === "select") {
      panelStore.select("device", device.id);
    }
  }

  function handleTerminalClick(term: TerminalDef, e: MouseEvent) {
    e.stopPropagation();
    if (onTerminalMouseDown) {
      onTerminalMouseDown(device.id, term.id, e);
    }
  }

  function handleTerminalRelease(term: TerminalDef, e: MouseEvent) {
    e.stopPropagation();
    if (onTerminalMouseUp) {
      onTerminalMouseUp(device.id, term.id, e);
    }
  }
</script>

<g
  class="device-item cursor-pointer select-none"
  transform="translate({x}, {y})"
  onclick={handleDeviceClick}
  role="button"
  tabindex="0"
>
  <!-- Outer Enclosure / DIN Box body -->
  <rect
    x="1"
    y="1"
    width={totalWidth - 2}
    height={heightPx - 2}
    rx="4"
    fill="#f8fafc"
    stroke={isSelected ? "#2563eb" : "#94a3b8"}
    stroke-width={isSelected ? 3 : 1.5}
    class="hover:stroke-blue-400"
  />

  <!-- Internal slot dividers for multi-module devices -->
  {#if device.widthModules > 1 && def?.category !== "ats"}
    {#each Array(device.widthModules - 1) as _, i}
      <line
        x1={(i + 1) * moduleWidthPx}
        y1="2"
        x2={(i + 1) * moduleWidthPx}
        y2={heightPx - 2}
        stroke="#cbd5e1"
        stroke-dasharray="3,3"
      />
    {/each}
  {/if}

  {#if def}
    <ActiveFaceplate
      {device}
      {def}
      {totalWidth}
      {heightPx}
      {poles}
    />
  {/if}

  <!-- TOP TERMINALS -->
  {#each topTerminals as term (term.id)}
    {@const termX = term.slotOffset * moduleWidthPx}
    {@const termY = term.yOffset !== undefined ? term.yOffset : 12}
    {@const isCompact3 = device.widthModules === 1 && topTerminals.length >= 3}
    <g
      class="terminal terminal-top cursor-pointer group"
      transform="translate({termX}, {termY})"
      onmousedown={(e) => handleTerminalClick(term, e)}
      onmouseup={(e) => handleTerminalRelease(term, e)}
      onclick={(e) => e.stopPropagation()}
      role="button"
      tabindex="0"
    >
      <!-- Generous invisible hit area (scaled for 3-terminal 1M blocks so neighbors don't overlap) -->
      <circle r={isCompact3 ? 6.2 : 14} fill="transparent" />
      <title>{term.label}</title>

      <!-- Screw / Terminal Housing -->
      <circle
        r={def?.category === "ats" && term.id.startsWith("SIG") ? 4 : isCompact3 ? 4.3 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? 5.5 : 8)}
        fill="#e2e8f0"
        stroke="#64748b"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3
          ? 1.1
          : 1.5}
        class="group-hover:stroke-blue-500 group-hover:scale-125"
      />
      <!-- Screw Slot -->
      <line
        x1={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? -2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? -2.5 : -4)}
        y1={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? -1.8 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? -2 : -3)}
        x2={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? 2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? 2.5 : 4)}
        y2={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? 1.8 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? 2 : 3)}
        stroke="#475569"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3
          ? 1
          : 1.5}
      />

      <!-- Interactive Click Dot -->
      <circle
        r={isCompact3 ? 3 : 4}
        fill="#3b82f6"
        class="opacity-0 group-hover:opacity-100"
      />

      <!-- Terminal Label -->
      {#if def?.typeId !== 'mts-2p-63a'}
        <text
          x="0"
          y={isCompact3 ? 11.5 : (def?.category === "ats" ? (term.id.startsWith("SIG") ? 12 : 16) : 18)}
          text-anchor="middle"
          font-size={isCompact3 ? "4.2" : (device.widthModules === 1 && topTerminals.length > 1 ? "5.5" : (def?.category === "ats" ? "6.5" : "7"))}
          font-weight="bold"
          fill="#475569"
        >
          {term.label}
        </text>
      {/if}
    </g>
  {/each}

  <!-- BOTTOM TERMINALS -->
  {#each bottomTerminals as term (term.id)}
    {@const termX = term.slotOffset * moduleWidthPx}
    {@const termY = term.yOffset !== undefined ? term.yOffset : heightPx - 14}
    {@const isCompact3 = device.widthModules === 1 && bottomTerminals.length >= 3 && def?.typeId !== 'terminal-dist-1in4out'}
    <g
      class="terminal terminal-bottom cursor-pointer group"
      transform="translate({termX}, {termY})"
      onmousedown={(e) => handleTerminalClick(term, e)}
      onmouseup={(e) => handleTerminalRelease(term, e)}
      onclick={(e) => e.stopPropagation()}
      role="button"
      tabindex="0"
    >
      <!-- Generous invisible hit area (scaled for 3-terminal 1M blocks so neighbors don't overlap) -->
      <circle r={isCompact3 ? 6.2 : 14} fill="transparent" />
      <title>{term.label}</title>

      <!-- Terminal Label -->
      {#if def?.typeId !== 'mts-2p-63a'}
        <text
          x="0"
          y={isCompact3
            ? -6.5
            : def?.category === "ats"
              ? term.id.startsWith("SIG")
                ? -7
                : -9
              : (def?.typeId === 'terminal-dist-1in4out' ? -7 : -10)}
          text-anchor="middle"
          font-size={isCompact3 ? "4.1" : (def?.typeId === 'terminal-dist-1in4out' ? "4.8" : (device.widthModules === 1 && bottomTerminals.length > 1 ? "5.5" : (def?.category === "ats" ? "6.5" : "7")))}
          font-weight="bold"
          fill="#475569"
        >
          {term.label}
        </text>
      {/if}

      <!-- Screw / Terminal Housing -->
      <circle
        r={def?.category === "ats" && term.id.startsWith("SIG") ? 4 : isCompact3 ? 4.3 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? 5.5 : 8)}
        fill="#e2e8f0"
        stroke="#64748b"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3
          ? 1.1
          : 1.5}
        class="group-hover:stroke-blue-500 group-hover:scale-125"
      />
      <!-- Screw Slot -->
      <line
        x1={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? -2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? -2.5 : -4)}
        y1={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? -1.8 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? -2 : -3)}
        x2={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? 2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? 2.5 : 4)}
        y2={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3 ? 1.8 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? 2 : 3)}
        stroke="#475569"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG") || isCompact3
          ? 1
          : 1.5}
      />

      <!-- Interactive Click Dot -->
      <circle
        r={isCompact3 ? 3 : 4}
        fill="#3b82f6"
        class="opacity-0 group-hover:opacity-100"
      />
    </g>
  {/each}
</g>
