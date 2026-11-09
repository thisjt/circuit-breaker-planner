<script lang="ts">
  import type { FreeEquipment, WireRole } from "#lib/types";

  interface Props {
    eq: FreeEquipment;
    w: number;
    h: number;
    isSelected: boolean;
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
    w,
    h,
    isSelected,
    onEquipmentTerminalMouseDown,
    onTerminalMouseUp,
  }: Props = $props();
</script>

<!-- BATTERY (Energy Storage Server-Rack / LiFePO4 Module) -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="6"
  fill="#18181b"
  stroke={isSelected ? "#38bdf8" : "#71717a"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-emerald-400"
/>
<!-- Green Energy Storage Accent Bar -->
<rect x="0" y="0" width={w} height="4" rx="2" fill="#10b981" />
<!-- Battery Status LEDs / SoC Meter -->
<g transform="translate(18, 30)">
  {#each Array(5) as _, i}
    <rect x={i * 9} y="0" width="6" height="5" rx="1" fill="#10b981" opacity={0.6 + i * 0.1} />
  {/each}
  <text x="56" y="5" font-size="5.5" font-weight="bold" fill="#10b981" font-family="monospace">SoC 100%</text>
</g>
<!-- Large Autocalculated Capacity (kWh) -->
<text x={w / 2} y={h / 2 + 10} font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">
  {((eq.whCalculated || (eq.batteryVoltage || 51.2) * (eq.capacityAh || 100)) / 1000).toFixed(2)} kWh
</text>
<!-- Voltage & Ah Subtitle -->
<text x={w / 2} y={h / 2 + 23} font-size="7" font-weight="bold" fill="#a1a1aa" text-anchor="middle" font-family="monospace">
  {eq.batteryVoltage || 51.2}V • {eq.capacityAh || 100}Ah ({eq.chemistry || "LiFePO4"})
</text>
<text x={w / 2} y={h - 10} font-size="7.5" font-weight="bold" fill="#f4f4f5" text-anchor="middle">
  {eq.label}
</text>

<!-- TERMINAL BAT+ (Left) -->
<g
  class="terminal cursor-pointer group/batpos"
  transform="translate(32, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Battery Positive (BAT+)</title>
  <circle r="7" fill="#dc2626" stroke="#fecaca" stroke-width="1.5" class="group-hover/batpos:scale-125" />
  <text x="0" y="2.5" text-anchor="middle" font-size="7" font-weight="900" fill="#ffffff">+</text>
  <text x="0" y="-10" text-anchor="middle" font-size="6" font-weight="bold" fill="#ef4444">BAT+</text>
</g>

<!-- TERMINAL BAT- (Right) -->
<g
  class="terminal cursor-pointer group/batneg"
  transform="translate({w - 32}, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Battery Negative (BAT-)</title>
  <circle r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" class="group-hover/batneg:scale-125" />
  <text x="0" y="2.5" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">-</text>
  <text x="0" y="-10" text-anchor="middle" font-size="6" font-weight="bold" fill="#cbd5e1">BAT-</text>
</g>

