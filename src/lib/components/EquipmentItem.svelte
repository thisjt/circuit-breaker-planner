<script lang="ts">
  import type { FreeEquipment, WireRole } from "#lib/types";
  import { panelStore } from "#lib/state.svelte";

  import SolarPvModuleString from "./categories/solar-and-energy-storage/solar-pv-module-string.svelte";
  import BatteryStorageLifepo4 from "./categories/solar-and-energy-storage/battery-storage-lifepo4.svelte";
  import HybridInverter from "./categories/solar-and-energy-storage/hybrid-inverter.svelte";
  import OffGridInverter from "./categories/solar-and-energy-storage/off-grid-inverter.svelte";
  import MoldedCaseCircuitBreakerMccb from "./categories/mccb-heavy-duty-breakers/molded-case-circuit-breaker-mccb.svelte";
  import DetachedFieldBlock from "./categories/terminals-and-field-blocks/detached-field-block.svelte";

  interface Props {
    eq: FreeEquipment;
    onEquipmentMouseDown: (eqId: string, e: MouseEvent) => void;
    onEquipmentTerminalMouseDown: (
      eqId: string,
      termId: string,
      defaultRole: WireRole,
      e: MouseEvent,
    ) => void;
    onTerminalMouseUp: (
      deviceId: string,
      terminalId: string,
      e: MouseEvent,
    ) => void;
  }

  let {
    eq,
    onEquipmentMouseDown,
    onEquipmentTerminalMouseDown,
    onTerminalMouseUp,
  }: Props = $props();

  const isSelected = $derived(
    (panelStore.selectedType === "equipment" ||
      panelStore.selectedType === "field_block") &&
      panelStore.selectedId === eq.id,
  );
  const w = $derived(eq.width || 100);
  const h = $derived(eq.height || 100);

  const EQUIPMENT_COMPONENTS = {
    solar_panel: SolarPvModuleString,
    battery: BatteryStorageLifepo4,
    hybrid_inverter: HybridInverter,
    offgrid_inverter: OffGridInverter,
    mccb: MoldedCaseCircuitBreakerMccb,
    field_block: DetachedFieldBlock,
  } as const;

  const ActiveComponent = $derived(
    EQUIPMENT_COMPONENTS[eq.type] || DetachedFieldBlock,
  );
</script>

<g
  class="free-equipment select-none cursor-move group"
  transform="translate({eq.x}, {eq.y})"
  onmousedown={(e) => onEquipmentMouseDown(eq.id, e)}
  onclick={(e) => {
    e.stopPropagation();
    panelStore.select("equipment", eq.id);
  }}
  role="button"
  tabindex="0"
>
  <!-- Lightweight Native Vector Shadow for Equipment -->
  <rect
    x="3"
    y="5"
    width={w}
    height={h}
    rx="6"
    fill="#020617"
    opacity="0.45"
    pointer-events="none"
  />

  <ActiveComponent
    {eq}
    {w}
    {h}
    {isSelected}
    {onEquipmentTerminalMouseDown}
    {onTerminalMouseUp}
  />
</g>

