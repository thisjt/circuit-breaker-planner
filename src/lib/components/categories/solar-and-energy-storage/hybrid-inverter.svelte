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

<!-- Inverter Header Pill -->
<rect
  x={w / 2 - 48}
  y="11"
  width="96"
  height="13"
  rx="3"
  fill="#e0f2fe"
  stroke="#38bdf8"
  stroke-width="0.8"
/>
<text
  x={w / 2}
  y="20.5"
  font-size="6.8"
  font-weight="900"
  fill="#0369a1"
  text-anchor="middle"
  font-family="monospace"
>
  ⚡ HYBRID INVERTER
</text>

<!-- Large LCD Screen -->
<rect
  x="14"
  y="28"
  width={w - 28}
  height="72"
  rx="4"
  fill="#091428"
  stroke="#1e293b"
  stroke-width="1.2"
/>
<!-- Interactive Inverter Flow Schematic on Screen -->
<text
  x={w / 2}
  y="43"
  font-size="8.5"
  font-weight="bold"
  fill="#38bdf8"
  text-anchor="middle"
  font-family="monospace"
>
  STORAGE INVERTER {eq.capacityKw || 8}kW
</text>
<!-- Flow Icons -->
<g
  transform="translate({w / 2 - 55}, 52)"
  font-size="7.5"
  fill="#e2e8f0"
  font-family="monospace"
>
  <text x="0" y="10">☀️ PV</text>
  <text x="36" y="10">➔ ⚡ ➔</text>
  <text x="75" y="10">🏠 LOAD</text>
  <text x="0" y="27">🔋 BAT</text>
  <text x="36" y="27">⇄ ⚡ ⇄</text>
  <text x="75" y="27">🏢 GRID</text>
</g>

<!-- Status LEDs -->
<g transform="translate(18, 110)">
  <circle cx="8" cy="0" r="3" fill="#22c55e" />
  <text x="15" y="3" font-size="6" font-weight="bold" fill="#475569">NORMAL</text>
  <circle cx="60" cy="0" r="3" fill="#3b82f6" />
  <text x="67" y="3" font-size="6" font-weight="bold" fill="#475569">INVERT</text>
  <circle cx="112" cy="0" r="3" fill="#ef4444" />
  <text x="119" y="3" font-size="6" font-weight="bold" fill="#475569">ALARM</text>
</g>

<!-- Label & Description -->
<text
  x={w / 2}
  y="128"
  font-size="8.5"
  font-weight="900"
  fill="#0f172a"
  text-anchor="middle"
>
  {eq.label}
</text>
<text
  x={w / 2}
  y="138"
  font-size="5.5"
  font-weight="bold"
  fill="#64748b"
  text-anchor="middle"
>
  {eq.description || "Dual MPPT 48V Storage"}
</text>

<!-- ========================================== -->
<!-- BOTTOM TERMINAL BAY COMPARTMENT            -->
<!-- ========================================== -->
<rect
  x="6"
  y={h - 66}
  width={w - 12}
  height="60"
  rx="4"
  fill="#0f172a"
  stroke="#334155"
  stroke-width="1"
/>

<!-- Section Dividers & Compartment Headers -->
<line
  x1={w / 2}
  y1={h - 64}
  x2={w / 2}
  y2={h - 6}
  stroke="#1e293b"
  stroke-width="1"
/>

<!-- DC Section Title (Upper Left & Upper Right) -->
<text
  x="44"
  y={h - 52}
  font-size="5"
  font-weight="900"
  fill="#f59e0b"
  text-anchor="middle"
  font-family="monospace"
>
  ☀️ PV IN
</text>
<text
  x={w - 44}
  y={h - 52}
  font-size="5"
  font-weight="900"
  fill="#38bdf8"
  text-anchor="middle"
  font-family="monospace"
>
  🔋 BATTERY
</text>

<!-- AC Section Subtitles (Lower) -->
<text
  x="50"
  y={h - 23}
  font-size="4.5"
  font-weight="bold"
  fill="#93c5fd"
  text-anchor="middle"
  font-family="monospace"
>
  AC GRID IN
</text>
<text
  x={w - 50}
  y={h - 23}
  font-size="4.5"
  font-weight="bold"
  fill="#fca5a5"
  text-anchor="middle"
  font-family="monospace"
>
  AC LOAD OUT
</text>

<!-- ========================================== -->
<!-- UPPER TIER: DC SOLAR PV & BATTERY INPUTS  -->
<!-- ========================================== -->
<!-- PV1+ -->
<g
  class="terminal cursor-pointer group/pv1pos"
  transform="translate(30, {h - 38})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV1+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV1+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>Hybrid Inverter PV1+ Positive Terminal</title>
  <circle
    r="5"
    fill="#dc2626"
    stroke="#fecaca"
    stroke-width="1.2"
    class="group-hover/pv1pos:scale-125"
  />
  <text x="0" y="1.8" text-anchor="middle" font-size="6" font-weight="bold" fill="#ffffff">+</text>
  <text
    x="0"
    y="-7"
    text-anchor="middle"
    font-size="4.5"
    font-weight="bold"
    fill="#ef4444"
  >
    PV+
  </text>
</g>

<!-- PV1- -->
<g
  class="terminal cursor-pointer group/pv1neg"
  transform="translate(58, {h - 38})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV1-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV1-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>Hybrid Inverter PV1- Negative Terminal</title>
  <circle
    r="5"
    fill="#334155"
    stroke="#94a3b8"
    stroke-width="1.2"
    class="group-hover/pv1neg:scale-125"
  />
  <text x="0" y="1.8" text-anchor="middle" font-size="6" font-weight="bold" fill="#ffffff">-</text>
  <text
    x="0"
    y="-7"
    text-anchor="middle"
    font-size="4.5"
    font-weight="bold"
    fill="#cbd5e1"
  >
    PV-
  </text>
</g>

<!-- BAT+ -->
<g
  class="terminal cursor-pointer group/hybbatpos"
  transform="translate({w - 58}, {h - 38})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>Hybrid Inverter BAT+ Positive Terminal</title>
  <circle
    r="5"
    fill="#dc2626"
    stroke="#fecaca"
    stroke-width="1.2"
    class="group-hover/hybbatpos:scale-125"
  />
  <text x="0" y="1.8" text-anchor="middle" font-size="6" font-weight="bold" fill="#ffffff">+</text>
  <text
    x="0"
    y="-7"
    text-anchor="middle"
    font-size="4.5"
    font-weight="bold"
    fill="#ef4444"
  >
    BAT+
  </text>
</g>

<!-- BAT- -->
<g
  class="terminal cursor-pointer group/hybbatneg"
  transform="translate({w - 30}, {h - 38})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "BAT-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "BAT-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>Hybrid Inverter BAT- Negative Terminal</title>
  <circle
    r="5"
    fill="#334155"
    stroke="#94a3b8"
    stroke-width="1.2"
    class="group-hover/hybbatneg:scale-125"
  />
  <text x="0" y="1.8" text-anchor="middle" font-size="7" font-weight="bold" fill="#ffffff">-</text>
  <text
    x="0"
    y="-7"
    text-anchor="middle"
    font-size="4.5"
    font-weight="bold"
    fill="#cbd5e1"
  >
    BAT-
  </text>
</g>

<!-- ========================================== -->
<!-- LOWER TIER: AC GRID IN & AC LOAD OUT       -->
<!-- ========================================== -->
<!-- AC_IN_L -->
<g
  class="terminal cursor-pointer group/acinl"
  transform="translate(26, {h - 14})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_IN_L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_IN_L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>AC Grid In - Line (L)</title>
  <circle
    r="4.5"
    fill="#2563eb"
    stroke="#bfdbfe"
    stroke-width="1.2"
    class="group-hover/acinl:scale-125"
  />
  <text
    x="0"
    y="10"
    text-anchor="middle"
    font-size="4"
    font-weight="bold"
    fill="#60a5fa"
  >
    L
  </text>
</g>

<!-- AC_IN_N -->
<g
  class="terminal cursor-pointer group/acinn"
  transform="translate(50, {h - 14})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_IN_N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_IN_N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>AC Grid In - Neutral (N)</title>
  <circle
    r="4.5"
    fill="#0284c7"
    stroke="#e0f2fe"
    stroke-width="1.2"
    class="group-hover/acinn:scale-125"
  />
  <text
    x="0"
    y="10"
    text-anchor="middle"
    font-size="4"
    font-weight="bold"
    fill="#38bdf8"
  >
    N
  </text>
</g>

<!-- AC_IN_PE -->
<g
  class="terminal cursor-pointer group/acinpe"
  transform="translate(74, {h - 14})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_IN_PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_IN_PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>AC Grid In - Protective Earth (PE)</title>
  <circle
    r="4.5"
    fill="#16a34a"
    stroke="#bbf7d0"
    stroke-width="1.2"
    class="group-hover/acinpe:scale-125"
  />
  <text
    x="0"
    y="10"
    text-anchor="middle"
    font-size="4"
    font-weight="bold"
    fill="#4ade80"
  >
    PE
  </text>
</g>

<!-- AC_OUT_L -->
<g
  class="terminal cursor-pointer group/acoutl"
  transform="translate({w - 74}, {h - 14})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>AC Load / Backup Out - Line (L)</title>
  <circle
    r="4.5"
    fill="#dc2626"
    stroke="#fecaca"
    stroke-width="1.2"
    class="group-hover/acoutl:scale-125"
  />
  <text
    x="0"
    y="10"
    text-anchor="middle"
    font-size="4"
    font-weight="bold"
    fill="#f87171"
  >
    L
  </text>
</g>

<!-- AC_OUT_N -->
<g
  class="terminal cursor-pointer group/acoutn"
  transform="translate({w - 50}, {h - 14})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>AC Load / Backup Out - Neutral (N)</title>
  <circle
    r="4.5"
    fill="#0284c7"
    stroke="#e0f2fe"
    stroke-width="1.2"
    class="group-hover/acoutn:scale-125"
  />
  <text
    x="0"
    y="10"
    text-anchor="middle"
    font-size="4"
    font-weight="bold"
    fill="#38bdf8"
  >
    N
  </text>
</g>

<!-- AC_OUT_PE -->
<g
  class="terminal cursor-pointer group/acoutpe"
  transform="translate({w - 26}, {h - 14})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "AC_OUT_PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "AC_OUT_PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="12" fill="transparent" />
  <title>AC Load / Backup Out - Protective Earth (PE)</title>
  <circle
    r="4.5"
    fill="#16a34a"
    stroke="#bbf7d0"
    stroke-width="1.2"
    class="group-hover/acoutpe:scale-125"
  />
  <text
    x="0"
    y="10"
    text-anchor="middle"
    font-size="4"
    font-weight="bold"
    fill="#4ade80"
  >
    PE
  </text>
</g>
