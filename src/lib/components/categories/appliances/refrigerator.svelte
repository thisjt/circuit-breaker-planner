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

<!-- REFRIGERATOR -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="8"
  fill="#1e293b"
  stroke={isSelected ? "#38bdf8" : "#64748b"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-cyan-400"
/>
<!-- Top Cyan Cooling Accent Bar -->
<rect x="0" y="0" width={w} height="4.5" rx="2" fill="#06b6d4" />

<!-- Category Badge -->
<rect
  x={w / 2 - 42}
  y={isTop ? 27 : 8}
  width="84"
  height="11"
  rx="2.5"
  fill="#083344"
  stroke="#0891b2"
  stroke-width="0.8"
/>
<text
  x={w / 2}
  y={isTop ? 34.5 : 15.5}
  font-size="5.8"
  font-weight="900"
  fill="#67e8f9"
  text-anchor="middle"
  font-family="monospace"
>
  🧊 REFRIGERATOR
</text>

<!-- Authorable Watts Readout -->
<text
  x={w / 2}
  y={isTop ? 54 : 35}
  font-size="14"
  font-weight="900"
  fill="#ffffff"
  text-anchor="middle"
  font-family="system-ui, sans-serif"
>
  {eq.powerWatts ?? 250} W
</text>

<!-- Double-Door Fridge Silhouette -->
<g transform="translate({w / 2 - 26}, {isTop ? 60 : 41})">
  <rect x="0" y="0" width="52" height="28" rx="2.5" fill="#0f172a" stroke="#475569" stroke-width="1" />
  <line x1="26" y1="0" x2="26" y2="28" stroke="#475569" stroke-width="1" />
  <!-- Door Handles -->
  <line x1="22" y1="6" x2="22" y2="22" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" />
  <line x1="30" y1="6" x2="30" y2="22" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" />
</g>

<!-- Label & Subtitle -->
<text
  x={w / 2}
  y={isTop ? 101 : 82}
  font-size="7.5"
  font-weight="bold"
  fill="#f1f5f9"
  text-anchor="middle"
>
  {eq.label}
</text>
<text
  x={w / 2}
  y={isTop ? 111 : 92}
  font-size="5.5"
  font-weight="bold"
  fill="#94a3b8"
  text-anchor="middle"
>
  {eq.description || "230V Inverter Fridge"}
</text>

<!-- TERMINALS: L (Left), N (Center), PE (Right) -->
<g
  class="terminal cursor-pointer group/refri_l"
  transform="translate(24, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Refrigerator Line (L / L1)</title>
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.3" class="group-hover/refri_l:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">L</text>
</g>

<g
  class="terminal cursor-pointer group/refri_n"
  transform="translate({w / 2}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Refrigerator Neutral / Line 2 (N)</title>
  <circle r="5.5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.3" class="group-hover/refri_n:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#38bdf8">N</text>
</g>

<g
  class="terminal cursor-pointer group/refri_pe"
  transform="translate({w - 24}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Refrigerator Protective Earth (PE)</title>
  <circle r="5.5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.3" class="group-hover/refri_pe:scale-125" />
  <text x="0" y={isTop ? -8 : 13} text-anchor="middle" font-size="5" font-weight="bold" fill="#22c55e">PE</text>
</g>

