<script lang="ts">
  import type { FreeEquipment, WireRole } from "#lib/types";
  import { panelStore } from "#lib/state.svelte";

  import SolarPvModuleString from "./categories/solar-and-energy-storage/solar-pv-module-string.svelte";
  import BatteryStorageLifepo4 from "./categories/solar-and-energy-storage/battery-storage-lifepo4.svelte";
  import HybridInverter from "./categories/solar-and-energy-storage/hybrid-inverter.svelte";
  import OffGridInverter from "./categories/solar-and-energy-storage/off-grid-inverter.svelte";
  import MoldedCaseCircuitBreakerMccb from "./categories/mccb-heavy-duty-breakers/molded-case-circuit-breaker-mccb.svelte";
  import DetachedFieldBlock from "./categories/terminals-and-field-blocks/detached-field-block.svelte";
  import HvacUnit from "./categories/appliances/hvac.svelte";
  import ShowerWaterHeater from "./categories/appliances/shower-water-heater.svelte";
  import RefrigeratorUnit from "./categories/appliances/refrigerator.svelte";
  import EvChargerUnit from "./categories/appliances/ev-charger.svelte";
  import Outlet3Gang2Port from "./categories/accessories-and-hardware/outlet-3-gang-2-port.svelte";

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
    hvac: HvacUnit,
    water_heater: ShowerWaterHeater,
    refrigerator: RefrigeratorUnit,
    ev_charger: EvChargerUnit,
    outlet_3gang: Outlet3Gang2Port,
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

  {#if isSelected && (eq.type === 'solar_panel' || eq.type === 'hvac' || eq.type === 'water_heater' || eq.type === 'refrigerator' || eq.type === 'ev_charger' || eq.type === 'outlet_3gang' || eq.type === 'field_block')}
    <!-- Quick Flip Terminal Button on Canvas -->
    <g
      class="cursor-pointer group/flip"
      transform="translate({w / 2}, -10)"
      onmousedown={(e) => e.stopPropagation()}
      onclick={(e) => {
        e.stopPropagation();
        const currentPos = eq.terminalPosition || 'top';
        panelStore.updateEquipment(eq.id, {
          terminalPosition: currentPos === 'bottom' ? 'top' : 'bottom'
        });
      }}
      role="button"
      tabindex="0"
    >
      <rect
        x="-36"
        y="-8"
        width="72"
        height="16"
        rx="8"
        fill="#0f172a"
        stroke="#38bdf8"
        stroke-width="1.2"
        class="group-hover/flip:fill-blue-600 group-hover/flip:stroke-white transition"
      />
      <text
        x="0"
        y="3"
        font-size="7.5"
        font-weight="bold"
        fill="#f8fafc"
        text-anchor="middle"
        font-family="system-ui, sans-serif"
      >
        ↕ Ports: {eq.terminalPosition === 'bottom' ? 'Down' : 'Up'}
      </text>
    </g>
  {/if}
</g>

