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

  const isTop = $derived(eq.terminalPosition !== "bottom");
  const termY = $derived(isTop ? 14 : h - 14);
</script>

<!-- SHOWER WATER HEATER -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="8"
  fill="#18181b"
  stroke={isSelected ? "#38bdf8" : "#64748b"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-rose-400"
/>
<!-- Top Warm Orange/Rose Accent Bar -->
<rect x="0" y="0" width={w} height="4.5" rx="2" fill="#f97316" />

<!-- Category Badge -->
<rect
  x={w / 2 - 42}
  y={isTop ? 27 : 8}
  width="84"
  height="11"
  rx="2.5"
  fill="#431407"
  stroke="#ea580c"
  stroke-width="0.8"
/>
<text
  x={w / 2}
  y={isTop ? 34.5 : 15.5}
  font-size="5.8"
  font-weight="900"
  fill="#fdba74"
  text-anchor="middle"
  font-family="monospace"
>
  🚿 WATER HEATER
</text>

<!-- Authorable Kilowatts Readout -->
<text
  x={w / 2}
  y={isTop ? 54 : 35}
  font-size="14"
  font-weight="900"
  fill="#ffffff"
  text-anchor="middle"
  font-family="system-ui, sans-serif"
>
  {eq.capacityKw ?? 3.5} kW
</text>

<!-- Digital Temp & Heating Coil Display -->
<g transform="translate({w / 2 - 34}, {isTop ? 61 : 42})">
  <rect x="0" y="0" width="68" height="20" rx="3" fill="#090d16" stroke="#334155" stroke-width="0.9" />
  <circle cx="14" cy="10" r="6" fill="none" stroke="#f97316" stroke-width="1.4" />
  <circle cx="14" cy="10" r="2" fill="#ef4444" />
  <text x="44" y="13" font-size="8" font-weight="900" fill="#fb923c" text-anchor="middle" font-family="monospace">
    42.0°C
  </text>
</g>

<!-- Label & Subtitle -->
<text
  x={w / 2}
  y={isTop ? 95 : 76}
  font-size="7.5"
  font-weight="bold"
  fill="#f1f5f9"
  text-anchor="middle"
>
  {eq.label}
</text>
<text
  x={w / 2}
  y={isTop ? 105 : 86}
  font-size="5.5"
  font-weight="bold"
  fill="#94a3b8"
  text-anchor="middle"
>
  {eq.description || "230V Single-Point"}
</text>

<!-- TERMINALS: L (Left), N (Center), PE (Right) -->
<g
  class="terminal cursor-pointer group/whl"
  transform="translate(24, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Water Heater Line (L / L1)</title>
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.3" class="group-hover/whl:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">L</text>
</g>

<g
  class="terminal cursor-pointer group/whn"
  transform="translate({w / 2}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Water Heater Neutral / Line 2 (N)</title>
  <circle r="5.5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.3" class="group-hover/whn:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#38bdf8">N</text>
</g>

<g
  class="terminal cursor-pointer group/whpe"
  transform="translate({w - 24}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Water Heater Protective Earth (PE)</title>
  <circle r="5.5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.3" class="group-hover/whpe:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#22c55e">PE</text>
</g>

