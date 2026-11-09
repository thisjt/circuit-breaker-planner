<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let { device, def, totalWidth }: Props = $props();
</script>

<!-- 1-IN 4-OUT UNIPOLAR DISTRIBUTION BLOCK (UKK 80A Style) -->
<!-- Top cavity for incoming 16mm² terminal -->
<rect x="4" y="2" width="36" height="26" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

<!-- Bottom tiered cavities for 4 branch terminals -->
<rect x="4" y="114" width="36" height="20" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />
<rect x="4" y="136" width="36" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

<!-- Center Modular Faceplate Body -->
<rect
  x="3"
  y="30"
  width={totalWidth - 6}
  height="82"
  rx="3"
  fill="#f8fafc"
  stroke="#cbd5e1"
  stroke-width="1.2"
/>

<!-- Sky Blue Category Accent Strip -->
<rect
  x="3"
  y="30"
  width={totalWidth - 6}
  height="4"
  rx="1.5"
  fill={def.colorAccent || "#0284c7"}
/>

<!-- Title Badge -->
<text
  x={totalWidth / 2}
  y="42"
  text-anchor="middle"
  font-size="6"
  font-weight="900"
  fill="#0f172a"
  font-family="system-ui, sans-serif"
>
  {device.customLabel || "DIST BLOCK"}
</text>

<!-- Subtitle Pill: 1-IN 4-OUT -->
<rect x="6" y="46" width="32" height="9" rx="1.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.5" />
<text
  x={totalWidth / 2}
  y="52.5"
  text-anchor="middle"
  font-size="4.8"
  font-weight="900"
  fill="#0369a1"
  font-family="monospace"
>
  1-IN  4-OUT
</text>

<!-- Ratings -->
<text
  x={totalWidth / 2}
  y="61"
  text-anchor="middle"
  font-size="4.5"
  font-weight="bold"
  fill="#64748b"
  font-family="monospace"
>
  80A 500V~
</text>

<!-- Internal Distribution Copper Bus Graphic -->
<g class="bus-schematic" transform="translate(6, 65)">
  <line x1="16" y1="0" x2="16" y2="7" stroke="#d97706" stroke-width="2" />
  <circle cx="16" cy="7" r="1.5" fill="#b45309" />
  <rect x="2" y="7" width="28" height="3" rx="0.8" fill="#d97706" stroke="#b45309" stroke-width="0.5" />
  <line x1="5" y1="10" x2="5" y2="18" stroke="#d97706" stroke-width="1.3" />
  <line x1="12" y1="10" x2="12" y2="18" stroke="#d97706" stroke-width="1.3" />
  <line x1="20" y1="10" x2="20" y2="18" stroke="#d97706" stroke-width="1.3" />
  <line x1="27" y1="10" x2="27" y2="18" stroke="#d97706" stroke-width="1.3" />
  <circle cx="5" cy="18" r="1" fill="#b45309" />
  <circle cx="12" cy="18" r="1" fill="#b45309" />
  <circle cx="20" cy="18" r="1" fill="#b45309" />
  <circle cx="27" cy="18" r="1" fill="#b45309" />
</g>

<!-- Circuit description / tag at bottom of faceplate -->
<text
  x={totalWidth / 2}
  y="102"
  text-anchor="middle"
  font-size="5"
  font-weight="bold"
  fill="#64748b"
  class="truncate select-none font-sans"
>
  {device.circuitDescription || "Feeder Splitter"}
</text>

