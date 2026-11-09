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

<!-- HYBRID INVERTER -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="8"
  fill="#f8fafc"
  stroke={isSelected ? "#2563eb" : "#94a3b8"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-blue-400"
/>
<!-- Top Inverter Blue Accent Header -->
<rect x="0" y="0" width={w} height="6" rx="3" fill="#2563eb" />
<!-- Large LCD Screen -->
<rect x="14" y="34" width={w - 28} height="80" rx="4" fill="#091428" stroke="#1e293b" stroke-width="1.2" />
<!-- Interactive Inverter Flow Schematic on Screen -->
<text x={w / 2} y="50" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="monospace">
  HYBRID INVERTER {eq.capacityKw || 8}kW
</text>
<!-- Flow Icons -->
<g transform="translate({w / 2 - 55}, 60)" font-size="7.5" fill="#e2e8f0" font-family="monospace">
  <text x="0" y="10">☀️ PV</text>
  <text x="36" y="10">➔ ⚡ ➔</text>
  <text x="75" y="10">🏠 LOAD</text>
  <text x="0" y="28">🔋 BAT</text>
  <text x="36" y="28">⇄ ⚡ ⇄</text>
  <text x="75" y="28">🏢 GRID</text>
</g>
<!-- Status LEDs -->
<g transform="translate(18, 126)">
  <circle cx="8" cy="0" r="3" fill="#22c55e" />
  <text x="15" y="3" font-size="6" font-weight="bold" fill="#475569">NORMAL</text>
  <circle cx="60" cy="0" r="3" fill="#3b82f6" />
  <text x="67" y="3" font-size="6" font-weight="bold" fill="#475569">INVERT</text>
  <circle cx="112" cy="0" r="3" fill="#ef4444" />
  <text x="119" y="3" font-size="6" font-weight="bold" fill="#475569">ALARM</text>
</g>
<text x={w / 2} y={h - 34} font-size="8" font-weight="900" fill="#0f172a" text-anchor="middle">
  {eq.label}
</text>

<!-- TOP TERMINALS: Solar PV (Left) & Battery (Right) -->
<!-- PV1+ -->
<g
  class="terminal cursor-pointer group/pv1pos"
  transform="translate(28, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV1+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV1+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/pv1pos:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">PV+</text>
</g>
<!-- PV1- -->
<g
  class="terminal cursor-pointer group/pv1neg"
  transform="translate(56, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV1-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV1-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2" class="group-hover/pv1neg:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#475569">PV-</text>
</g>
<!-- BAT+ -->
<g
  class="terminal cursor-pointer group/hybbatpos"
  transform="translate({w - 56}, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/hybbatpos:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">BAT+</text>
</g>
<!-- BAT- -->
<g
  class="terminal cursor-pointer group/hybbatneg"
  transform="translate({w - 26}, 16)"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2" class="group-hover/hybbatneg:scale-125" />
  <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#475569">BAT-</text>
</g>

<!-- BOTTOM TERMINALS: AC GRID IN & AC LOAD OUT -->
<!-- AC_IN_L -->
<g
  class="terminal cursor-pointer group/acinl"
  transform="translate(26, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_IN_L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_IN_L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5" fill="#2563eb" stroke="#bfdbfe" stroke-width="1.2" class="group-hover/acinl:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#2563eb">GRID L</text>
</g>
<!-- AC_IN_N -->
<g
  class="terminal cursor-pointer group/acinn"
  transform="translate(50, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_IN_N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_IN_N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.2" class="group-hover/acinn:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#0284c7">GRID N</text>
</g>
<!-- AC_IN_PE -->
<g
  class="terminal cursor-pointer group/acinpe"
  transform="translate(74, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_IN_PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_IN_PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2" class="group-hover/acinpe:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#16a34a">PE</text>
</g>

<!-- AC_OUT_L -->
<g
  class="terminal cursor-pointer group/acoutl"
  transform="translate({w - 74}, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/acoutl:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#dc2626">LOAD L</text>
</g>
<!-- AC_OUT_N -->
<g
  class="terminal cursor-pointer group/acoutn"
  transform="translate({w - 50}, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.2" class="group-hover/acoutn:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#0284c7">LOAD N</text>
</g>
<!-- AC_OUT_PE -->
<g
  class="terminal cursor-pointer group/acoutpe"
  transform="translate({w - 26}, {h - 16})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2" class="group-hover/acoutpe:scale-125" />
  <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#16a34a">PE</text>
</g>

