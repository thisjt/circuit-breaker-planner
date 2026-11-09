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

<!-- OFFGRID INVERTER -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="8"
  fill="#0f172a"
  stroke={isSelected ? "#38bdf8" : "#334155"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-cyan-400"
/>
<!-- Cyan Offgrid Accent Bar -->
<rect x="0" y="0" width={w} height="5" rx="2" fill="#06b6d4" />
<!-- Inverter Screen -->
<rect x="14" y="32" width={w - 28} height="70" rx="4" fill="#0284c7" fill-opacity="0.15" stroke="#0284c7" stroke-width="1" />
<text x={w / 2} y="48" font-size="8.5" font-weight="900" fill="#38bdf8" text-anchor="middle" font-family="monospace">
  OFF-GRID {eq.capacityKw || 5}kW
</text>
<!-- Sine Wave Graphic -->
<path d="M {w / 2 - 25} 66 Q {w / 2 - 12.5} 56, {w / 2} 66 T {w / 2 + 25} 66" fill="none" stroke="#38bdf8" stroke-width="2" />
<text x={w / 2} y="82" font-size="6" font-weight="bold" fill="#bae6fd" text-anchor="middle" font-family="monospace">
  PURE SINE WAVE (48V)
</text>
<text x={w / 2} y={h - 32} font-size="8" font-weight="bold" fill="#f8fafc" text-anchor="middle">
  {eq.label}
</text>

<!-- TOP TERMINALS: PV & BATTERY -->
<g
  class="terminal cursor-pointer group/ogpvpos"
  transform="translate(32, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/ogpvpos:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">PV+</text>
</g>
<g
  class="terminal cursor-pointer group/ogpvneg"
  transform="translate(60, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#334155" stroke="#94a3b8" stroke-width="1.2" class="group-hover/ogpvneg:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#cbd5e1">PV-</text>
</g>
<g
  class="terminal cursor-pointer group/ogbatpos"
  transform="translate({w - 60}, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/ogbatpos:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">BAT+</text>
</g>
<g
  class="terminal cursor-pointer group/ogbatneg"
  transform="translate({w - 32}, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#334155" stroke="#94a3b8" stroke-width="1.2" class="group-hover/ogbatneg:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#cbd5e1">BAT-</text>
</g>

<!-- BOTTOM TERMINALS: AC OUT (L, N, PE) -->
<g
  class="terminal cursor-pointer group/ogacoutl"
  transform="translate(36, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/ogacoutl:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="5" font-weight="bold" fill="#dc2626">LOAD L</text>
</g>
<g
  class="terminal cursor-pointer group/ogacoutn"
  transform="translate(72, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.2" class="group-hover/ogacoutn:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="5" font-weight="bold" fill="#0284c7">LOAD N</text>
</g>
<g
  class="terminal cursor-pointer group/ogacoutpe"
  transform="translate(108, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2" class="group-hover/ogacoutpe:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="5" font-weight="bold" fill="#16a34a">PE</text>
</g>

