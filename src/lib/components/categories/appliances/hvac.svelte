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
  const hp = $derived(eq.horsepower ?? 1.5);
  const kw = $derived(eq.capacityKw ?? +(hp * 0.746).toFixed(2));
</script>

<!-- HVAC / SPLIT-TYPE AIR CONDITIONER UNIT -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="8"
  fill="#0f172a"
  stroke={isSelected ? "#38bdf8" : "#64748b"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-sky-400"
/>
<!-- Top Sky-Blue Cooling Accent Bar -->
<rect x="0" y="0" width={w} height="4.5" rx="2" fill="#0ea5e9" />

<!-- Category Badge -->
<rect
  x={w / 2 - 36}
  y={isTop ? 27 : 8}
  width="72"
  height="11"
  rx="2.5"
  fill="#082f49"
  stroke="#0284c7"
  stroke-width="0.8"
/>
<text
  x={w / 2}
  y={isTop ? 34.5 : 15.5}
  font-size="6"
  font-weight="900"
  fill="#38bdf8"
  text-anchor="middle"
  font-family="monospace"
>
  ❄️ HVAC UNIT
</text>

<!-- HP & Auto-Calculated kW Readout -->
<text
  x={w / 2}
  y={isTop ? 53 : 34}
  font-size="13"
  font-weight="900"
  fill="#f8fafc"
  text-anchor="middle"
  font-family="system-ui, sans-serif"
>
  {hp} HP
  <tspan font-size="9.5" fill="#38bdf8" font-family="monospace">({kw.toFixed(2)}kW)</tspan>
</text>

<!-- Air Louver Vents Graphic -->
<g transform="translate(14, {isTop ? 60 : 41})">
  <rect x="0" y="0" width={w - 28} height="16" rx="2" fill="#1e293b" stroke="#334155" stroke-width="0.8" />
  <line x1="6" y1="5" x2={w - 34} y2="5" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
  <line x1="6" y1="10.5" x2={w - 34} y2="10.5" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
</g>

<!-- Label & Subtitle -->
<text
  x={w / 2}
  y={isTop ? 88 : 69}
  font-size="7.5"
  font-weight="bold"
  fill="#e2e8f0"
  text-anchor="middle"
>
  {eq.label}
</text>
<text
  x={w / 2}
  y={isTop ? 98 : 79}
  font-size="5.5"
  font-weight="bold"
  fill="#94a3b8"
  text-anchor="middle"
>
  {eq.description || "230V Split-Type AC"}
</text>

<!-- TERMINALS: L (Left), N (Center), PE (Right) -->
<g
  class="terminal cursor-pointer group/hvacl"
  transform="translate(24, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>HVAC Line (L / L1)</title>
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.3" class="group-hover/hvacl:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">L</text>
</g>

<g
  class="terminal cursor-pointer group/hvacn"
  transform="translate({w / 2}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>HVAC Neutral / Line 2 (N)</title>
  <circle r="5.5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.3" class="group-hover/hvacn:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#38bdf8">N</text>
</g>

<g
  class="terminal cursor-pointer group/hvacpe"
  transform="translate({w - 24}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>HVAC Protective Earth (PE)</title>
  <circle r="5.5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.3" class="group-hover/hvacpe:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#22c55e">PE</text>
</g>

