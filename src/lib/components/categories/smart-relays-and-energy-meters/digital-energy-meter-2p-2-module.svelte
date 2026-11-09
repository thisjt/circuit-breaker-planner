<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let { device, def, totalWidth, heightPx }: Props = $props();
</script>

<!-- Recessed Front Faceplate -->
<rect
  x="3"
  y={heightPx * 0.22}
  width={totalWidth - 6}
  height={heightPx * 0.56}
  rx="3"
  fill="#ffffff"
  stroke="#cbd5e1"
  stroke-width="1"
/>

<!-- Category Color Accent Strip -->
<rect
  x="3"
  y={heightPx * 0.22}
  width={totalWidth - 6}
  height="4"
  fill={def.colorAccent || "#10b981"}
/>

<text
  x={totalWidth / 2}
  y={heightPx * 0.29}
  text-anchor="middle"
  font-size="9.5"
  font-weight="bold"
  fill="#0f172a"
  class="font-sans"
>
  {device.customLabel || def.name.split(" ")[0]}
</text>

<text
  x={totalWidth / 2}
  y={heightPx * 0.35}
  text-anchor="middle"
  font-size="6.5"
  fill="#64748b"
  font-family="monospace"
  font-weight="bold"
>
  230V {def.ratedAmps}A 50/60Hz
</text>

<!-- 2-Module LCD Display -->
<rect
  x="10"
  y={heightPx * 0.38}
  width={totalWidth - 20}
  height="42"
  rx="3"
  fill="#090d16"
  stroke="#1e293b"
  stroke-width="1.2"
/>
<rect
  x="12"
  y={heightPx * 0.38 + 2}
  width={totalWidth - 24}
  height="38"
  rx="1.5"
  fill="#022c22"
/>
<!-- LCD Digits -->
<text
  x={totalWidth / 2}
  y={heightPx * 0.38 + 13}
  text-anchor="middle"
  font-size="6.5"
  font-family="monospace"
  font-weight="bold"
  fill="#34d399"
>
  230.2 V   16.4 A
</text>
<text
  x={totalWidth / 2}
  y={heightPx * 0.38 + 24}
  text-anchor="middle"
  font-size="6.5"
  font-family="monospace"
  fill="#38bdf8"
>
  3.78 kW   50.0 Hz
</text>
<text
  x={totalWidth / 2}
  y={heightPx * 0.38 + 35}
  text-anchor="middle"
  font-size="7.5"
  font-family="monospace"
  font-weight="900"
  fill="#a7f3d0"
>
  [001428.6 kWh]
</text>

<!-- Controls below LCD -->
<circle cx="24" cy={heightPx * 0.69} r="2.5" fill="#ef4444" stroke="#991b1b" stroke-width="0.5" />
<text x="30" y={heightPx * 0.69 + 2} font-size="5" fill="#64748b">Pulse</text>

<rect x={totalWidth - 34} y={heightPx * 0.66} width="16" height="7" rx="1.5" fill="#334155" stroke="#475569" stroke-width="0.5" />
<text x={totalWidth - 26} y={heightPx * 0.66 + 5.5} font-size="5" font-weight="bold" fill="#cbd5e1" text-anchor="middle">Set</text>

<!-- Passthrough Indicator Schematic -->
<text
  x={totalWidth / 2}
  y={heightPx * 0.74}
  text-anchor="middle"
  font-size="5.5"
  font-weight="bold"
  fill="#059669"
>
  L1: Metered • L2/N: Pass-thru
</text>

