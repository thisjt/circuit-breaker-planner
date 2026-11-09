<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let { totalWidth }: Props = $props();
</script>

<!-- ATS (Automatic Transfer Switch) Specialized Rendering -->
<!-- Top & Bottom high-current isolation barriers between poles -->
<rect x="0" y="0" width="3" height="34" fill="#cbd5e1" />
<rect x="42.5" y="0" width="3" height="34" fill="#cbd5e1" />
<rect x="86.5" y="0" width="3" height="34" fill="#cbd5e1" />

<rect x="0" y="98" width="3" height="62" fill="#cbd5e1" />
<rect x="42.5" y="98" width="3" height="62" fill="#cbd5e1" />
<rect x="86.5" y="98" width="3" height="62" fill="#cbd5e1" />

<!-- Terminal cavities for power terminals -->
<rect x="4" y="2" width="38" height="26" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />
<rect x="47" y="2" width="38" height="26" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />

<rect x="4" y="103" width="38" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />
<rect x="47" y="103" width="38" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />

<rect x="4" y="135" width="38" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />
<rect x="47" y="135" width="38" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />

<!-- Front Raised Faceplate -->
<rect
  x="3"
  y="32"
  width={totalWidth - 6}
  height="94"
  rx="3"
  fill="#f8fafc"
  stroke="#cbd5e1"
  stroke-width="1"
/>

<!-- Left Glossy Phase Plate (Modules 0-2) -->
<rect
  x="4"
  y="33"
  width="82"
  height="92"
  rx="2"
  fill="#18181b"
  stroke="#27272a"
  stroke-width="1"
/>
<text
  x="45"
  y="48"
  text-anchor="middle"
  font-size="6.5"
  font-weight="bold"
  fill="#f1f5f9"
  class="tracking-wider"
>
  Normal Power A
</text>
<text
  x="22"
  y="84"
  text-anchor="middle"
  font-size="24"
  font-weight="900"
  fill="#ffffff"
  font-family="system-ui, sans-serif"
>
  R
</text>
<text
  x="66"
  y="84"
  text-anchor="middle"
  font-size="24"
  font-weight="900"
  fill="#ffffff"
  font-family="system-ui, sans-serif"
>
  N
</text>
<text
  x="45"
  y="114"
  text-anchor="middle"
  font-size="6.5"
  font-weight="bold"
  fill="#f1f5f9"
  class="tracking-wider"
>
  Reverse Power B
</text>

<!-- Center Rotary Control Section (Modules 2-3.5) -->
<rect
  x="88"
  y="33"
  width="68"
  height="92"
  fill="#ffffff"
  stroke="#e2e8f0"
  stroke-width="0.8"
/>

<!-- Top Source A indicator -->
<text
  x="122"
  y="45"
  text-anchor="middle"
  font-size="6"
  font-weight="bold"
  fill="#475569"
>
  Normal Power A
</text>
<rect x="116" y="48" width="12" height="7" rx="1" fill="#0f172a" />
<text
  x="122"
  y="54"
  text-anchor="middle"
  font-size="6"
  font-weight="bold"
  fill="#ef4444"
>
  I
</text>

<!-- Rotary Dial Switch -->
<g class="rotary-switch">
  <circle
    cx="122"
    cy="79"
    r="17"
    fill="#dc2626"
    stroke="#b91c1c"
    stroke-width="1.5"
  />
  <circle cx="122" cy="79" r="14" fill="#ef4444" />
  <g transform="rotate(-25, 122, 79)">
    <polygon points="119,64 125,64 124,94 120,94" fill="#991b1b" />
    <rect x="120" y="65" width="4" height="28" rx="2" fill="#b91c1c" />
    <circle cx="122" cy="79" r="4" fill="#dc2626" />
  </g>
  <path
    d="M 143 71 A 22 22 0 0 1 143 87"
    fill="none"
    stroke="#64748b"
    stroke-width="1.2"
    stroke-linecap="round"
  />
  <polygon points="142,69 145,73 140,73" fill="#64748b" />
  <polygon points="142,89 145,85 140,85" fill="#64748b" />
</g>

<!-- Bottom Source B indicator -->
<rect x="116" y="101" width="12" height="7" rx="1" fill="#0f172a" />
<text
  x="122"
  y="107"
  text-anchor="middle"
  font-size="6"
  font-weight="bold"
  fill="#64748b"
>
  O
</text>
<text
  x="122"
  y="118"
  text-anchor="middle"
  font-size="6"
  font-weight="bold"
  fill="#475569"
>
  Reverse Power B
</text>

<!-- Right Specifications & Control Section (Modules 3.5-6) -->
<rect
  x="158"
  y="33"
  width={totalWidth - 160}
  height="92"
  fill="#ffffff"
  stroke="#e2e8f0"
  stroke-width="0.8"
/>

<!-- Brand Header -->
<g transform="translate(164, 40)">
  <circle cx="5" cy="5" r="4.5" fill="none" stroke="#0f172a" stroke-width="1.2" />
  <path d="M 5 2.5 A 2.5 2.5 0 0 1 7.5 5" fill="none" stroke="#dc2626" stroke-width="1.2" />
  <text
    x="13"
    y="8"
    font-size="8"
    font-weight="900"
    fill="#0f172a"
    font-family="system-ui, sans-serif"
  >
    GRANDQ
  </text>
</g>

<!-- Model Badge Box -->
<rect x="164" y="52" width="66" height="10" rx="1" fill="#334155" />
<text
  x="197"
  y="59.5"
  text-anchor="middle"
  font-size="7"
  font-weight="bold"
  fill="#ffffff"
  font-family="monospace"
>
  ATS-GQ2-2P
</text>

<!-- Ratings specs list -->
<text x="164" y="68.5" font-size="5" fill="#334155" font-family="system-ui, sans-serif">
  Rated working current: <tspan font-weight="bold">100A</tspan>
</text>
<text x="164" y="75" font-size="5" fill="#334155" font-family="system-ui, sans-serif">
  Rated working voltage: <tspan font-weight="bold">220V AC</tspan>
</text>
<text x="164" y="81.5" font-size="5" fill="#334155" font-family="system-ui, sans-serif">
  Insulation voltage: <tspan font-weight="bold">690V AC</tspan>
</text>
<text x="164" y="88" font-size="5" fill="#334155" font-family="system-ui, sans-serif">
  Impact-resistant voltage: <tspan font-weight="bold">8kV</tspan>
</text>
<text x="164" y="94.5" font-size="5" fill="#334155" font-family="system-ui, sans-serif">
  Standard: <tspan font-weight="bold">IEC60947-6-1</tspan>
</text>
<text x="164" y="101" font-size="5" fill="#334155" font-family="system-ui, sans-serif">
  Control voltage: <tspan font-weight="bold">AC220V</tspan>
</text>

<!-- CE Mark -->
<text x="168" y="116" font-size="9" font-weight="900" fill="#0f172a" font-family="system-ui, sans-serif">
  CE
</text>

<!-- Right Controls Column -->
<circle cx="242" cy="44" r="3.5" fill="#ef4444" stroke="#b91c1c" stroke-width="0.8" />
<circle cx="241" cy="43" r="1" fill="#ffffff" opacity="0.6" />
<text x="250" y="46.5" font-size="6.5" font-weight="bold" fill="#0f172a">A</text>

<text x="243" y="57" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#475569">
  Manual
</text>
<rect x="239" y="60" width="8" height="18" rx="2" fill="#0f172a" />
<rect x="238" y="69" width="10" height="8" rx="1" fill="#475569" stroke="#1e293b" stroke-width="0.5" />
<line x1="240" y1="72" x2="246" y2="72" stroke="#94a3b8" stroke-width="0.6" />
<line x1="240" y1="74" x2="246" y2="74" stroke="#94a3b8" stroke-width="0.6" />
<text x="243" y="86" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#475569">
  Auto
</text>

<circle cx="242" cy="96" r="3.5" fill="#22c55e" stroke="#15803d" stroke-width="0.8" />
<circle cx="241" cy="95" r="1" fill="#ffffff" opacity="0.6" />
<text x="250" y="98.5" font-size="6.5" font-weight="bold" fill="#0f172a">B</text>

<!-- Top-Right Auxiliary Terminal Block & City Power graphics -->
<g class="top-auxiliary">
  <text x="146" y="13" font-size="6" font-weight="bold" fill="#334155" text-anchor="middle">
    City Power
  </text>
  <path
    d="M 146 15 L 141 30 M 146 15 L 151 30 M 140 21 L 152 21 M 139 26 L 153 26 M 142 21 L 150 26 M 150 21 L 142 26"
    fill="none"
    stroke="#475569"
    stroke-width="0.8"
  />
  <rect x="194" y="4" width="64" height="15" rx="2" fill="#15803d" stroke="#14532d" stroke-width="0.8" />
  {#each [200, 212, 224, 236, 248] as hx}
    <circle cx={hx} cy="11.5" r="2.5" fill="#052e16" stroke="#22c55e" stroke-width="0.5" />
  {/each}
  <text x="206" y="27" font-size="5" fill="#475569" text-anchor="middle">AC 220V In</text>
  <text x="240" y="27" font-size="5" fill="#475569" text-anchor="middle">Passive Out</text>
</g>

<!-- Bottom-Right Auxiliary Terminal Block & Generator graphics -->
<g class="bottom-auxiliary">
  <text x="146" y="136" font-size="6" font-weight="bold" fill="#334155" text-anchor="middle">
    Generator
  </text>
  <rect x="139" y="139" width="14" height="10" rx="1.5" fill="#e2e8f0" stroke="#475569" stroke-width="0.8" />
  <circle cx="143" cy="144" r="1.5" fill="#64748b" />
  <rect x="147" y="142" width="4" height="4" fill="#64748b" />
  <rect x="194" y="139" width="64" height="15" rx="2" fill="#15803d" stroke="#14532d" stroke-width="0.8" />
  {#each [200, 212, 224, 236, 248] as hx}
    <circle cx={hx} cy="146.5" r="2.5" fill="#052e16" stroke="#22c55e" stroke-width="0.5" />
  {/each}
  <text x="206" y="136" font-size="5" fill="#475569" text-anchor="middle">AC 220V In</text>
  <text x="240" y="136" font-size="5" fill="#475569" text-anchor="middle">Passive Out</text>
</g>

