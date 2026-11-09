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

<!-- EV WALLBOX CHARGER -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="10"
  fill="#090d16"
  stroke={isSelected ? "#38bdf8" : "#10b981"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-emerald-400"
/>
<!-- Top Emerald EV Accent Bar -->
<rect x="0" y="0" width={w} height="5" rx="2.5" fill="#10b981" />

<!-- Category Badge -->
<rect
  x={w / 2 - 42}
  y={isTop ? 27 : 8}
  width="84"
  height="11"
  rx="2.5"
  fill="#022c22"
  stroke="#10b981"
  stroke-width="0.8"
/>
<text
  x={w / 2}
  y={isTop ? 34.5 : 15.5}
  font-size="5.8"
  font-weight="900"
  fill="#6ee7b7"
  text-anchor="middle"
  font-family="monospace"
>
  🚗 EV CHARGER
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
  {eq.capacityKw ?? 7.0} kW
</text>

<!-- EV Charging Status Halo & Type-2 Holster -->
<g transform="translate({w / 2}, {isTop ? 75 : 56})">
  <circle cx="0" cy="0" r="14" fill="#022c22" stroke="#10b981" stroke-width="2" />
  <circle cx="0" cy="0" r="9" fill="#064e3b" />
  <text x="0" y="3.5" font-size="9" text-anchor="middle">⚡</text>
</g>

<!-- Label & Subtitle -->
<text
  x={w / 2}
  y={isTop ? 104 : 85}
  font-size="7.5"
  font-weight="bold"
  fill="#f1f5f9"
  text-anchor="middle"
>
  {eq.label}
</text>
<text
  x={w / 2}
  y={isTop ? 114 : 95}
  font-size="5.5"
  font-weight="bold"
  fill="#94a3b8"
  text-anchor="middle"
>
  {eq.description || "230V Level 2 AC Charger"}
</text>

<!-- TERMINALS: L (Left), N (Center), PE (Right) -->
<g
  class="terminal cursor-pointer group/evl"
  transform="translate(24, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>EV Charger Line (L / L1)</title>
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.3" class="group-hover/evl:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">L</text>
</g>

<g
  class="terminal cursor-pointer group/evn"
  transform="translate({w / 2}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>EV Charger Neutral / Line 2 (N)</title>
  <circle r="5.5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.3" class="group-hover/evn:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#38bdf8">N</text>
</g>

<g
  class="terminal cursor-pointer group/evpe"
  transform="translate({w - 24}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>EV Charger Protective Earth (PE)</title>
  <circle r="5.5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.3" class="group-hover/evpe:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#22c55e">PE</text>
</g>

