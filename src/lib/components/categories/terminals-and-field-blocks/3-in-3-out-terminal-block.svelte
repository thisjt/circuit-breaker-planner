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

<!-- 3-IN 3-OUT COMPACT 1-MODULE TERMINAL BLOCK -->
<!-- Top 3 cage terminal cavities -->
<rect x="3" y="2" width="11.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.7" />
<rect x="16.25" y="2" width="11.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.7" />
<rect x="29.5" y="2" width="11.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.7" />

<!-- Bottom 3 cage terminal cavities -->
<rect x="3" y="133" width="11.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.7" />
<rect x="16.25" y="133" width="11.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.7" />
<rect x="29.5" y="133" width="11.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.7" />

<!-- Center Modular Faceplate Body -->
<rect
  x="3"
  y="29"
  width={totalWidth - 6}
  height="102"
  rx="3"
  fill="#f8fafc"
  stroke="#cbd5e1"
  stroke-width="1.2"
/>

<!-- Teal Category Accent Strip -->
<rect
  x="3"
  y="29"
  width={totalWidth - 6}
  height="4"
  rx="1.5"
  fill={def.colorAccent || "#0d9488"}
/>

<!-- Title Badge -->
<text
  x={totalWidth / 2}
  y="41"
  text-anchor="middle"
  font-size="5.5"
  font-weight="900"
  fill="#0f172a"
  font-family="system-ui, sans-serif"
>
  {device.customLabel || "TERM BLOCK"}
</text>

<!-- Subtitle Pill: 3-IN 3-OUT -->
<rect x="5.5" y="44.5" width="33" height="9" rx="1.5" fill="#ccfbf1" stroke="#14b8a6" stroke-width="0.6" />
<text
  x={totalWidth / 2}
  y="51"
  text-anchor="middle"
  font-size="4.8"
  font-weight="900"
  fill="#0f766e"
  font-family="monospace"
>
  3-IN  3-OUT
</text>

<!-- Ratings -->
<text
  x={totalWidth / 2}
  y="59.5"
  text-anchor="middle"
  font-size="4.4"
  font-weight="bold"
  fill="#64748b"
  font-family="monospace"
>
  32A 450V~
</text>

<!-- 3 Internal Feed-Through Conductive Channels & Lever Actuators -->
<g transform="translate(0, 64)">
  <!-- Channel 1 (Left - Line / L) -->
  <line x1="8.8" y1="0" x2="8.8" y2="52" stroke="#f97316" stroke-width="1.6" stroke-dasharray="2,1" />
  <rect x="5.3" y="7" width="7" height="14" rx="1.2" fill="#ea580c" stroke="#9a3412" stroke-width="0.5" />
  <rect x="5.3" y="31" width="7" height="14" rx="1.2" fill="#ea580c" stroke="#9a3412" stroke-width="0.5" />

  <!-- Channel 2 (Center - Neutral / L2) -->
  <line x1="22" y1="0" x2="22" y2="52" stroke="#0284c7" stroke-width="1.6" stroke-dasharray="2,1" />
  <rect x="18.5" y="7" width="7" height="14" rx="1.2" fill="#0284c7" stroke="#075985" stroke-width="0.5" />
  <rect x="18.5" y="31" width="7" height="14" rx="1.2" fill="#0284c7" stroke="#075985" stroke-width="0.5" />

  <!-- Channel 3 (Right - Earth / PE / Ch3) -->
  <line x1="35.2" y1="0" x2="35.2" y2="52" stroke="#16a34a" stroke-width="1.6" stroke-dasharray="2,1" />
  <rect x="31.7" y="7" width="7" height="14" rx="1.2" fill="#16a34a" stroke="#166534" stroke-width="0.5" />
  <rect x="31.7" y="31" width="7" height="14" rx="1.2" fill="#16a34a" stroke="#166534" stroke-width="0.5" />
</g>

<!-- Circuit description / tag at bottom of faceplate -->
<text
  x={totalWidth / 2}
  y="126"
  text-anchor="middle"
  font-size="4.8"
  font-weight="bold"
  fill="#64748b"
  class="truncate select-none font-sans"
>
  {device.circuitDescription || "3-Way Pass"}
</text>

