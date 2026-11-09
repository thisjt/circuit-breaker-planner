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
  font-size="8"
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

<!-- 1-Module Compact LCD Display (18mm 2-Pole Meter) -->
<rect
  x="4"
  y={heightPx * 0.38}
  width={totalWidth - 8}
  height="40"
  rx="2"
  fill="#090d16"
  stroke="#1e293b"
  stroke-width="1"
/>
<rect
  x="5"
  y={heightPx * 0.38 + 1.5}
  width={totalWidth - 10}
  height="37"
  rx="1"
  fill="#022c22"
/>
<text
  x={totalWidth / 2}
  y={heightPx * 0.38 + 11}
  text-anchor="middle"
  font-size="5"
  font-family="monospace"
  font-weight="bold"
  fill="#34d399"
>
  230V 16A
</text>
<text
  x={totalWidth / 2}
  y={heightPx * 0.38 + 20}
  text-anchor="middle"
  font-size="5"
  font-family="monospace"
  fill="#38bdf8"
>
  3.7 kW
</text>
<text
  x={totalWidth / 2}
  y={heightPx * 0.38 + 31}
  text-anchor="middle"
  font-size="5.5"
  font-family="monospace"
  font-weight="bold"
  fill="#a7f3d0"
>
  01428 kWh
</text>

<!-- Pulse indicator and button -->
<circle cx="12" cy={heightPx * 0.67} r="2" fill="#ef4444" stroke="#991b1b" stroke-width="0.5" />
<rect x="22" y={heightPx * 0.65} width="11" height="5" rx="1" fill="#334155" stroke="#475569" stroke-width="0.5" />

<text
  x={totalWidth / 2}
  y={heightPx * 0.74}
  text-anchor="middle"
  font-size="5"
  font-weight="bold"
  fill="#059669"
>
  L-L / N Pass
</text>

