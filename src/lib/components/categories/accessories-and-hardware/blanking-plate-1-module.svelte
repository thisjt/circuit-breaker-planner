<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let { def, totalWidth, heightPx }: Props = $props();
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
  fill={def.colorAccent || "#cbd5e1"}
/>

<!-- Blanking Plate pattern -->
{#each Array(4) as _, b}
  <line
    x1={totalWidth * 0.2}
    y1={heightPx * (0.35 + b * 0.1)}
    x2={totalWidth * 0.8}
    y2={heightPx * (0.35 + b * 0.1)}
    stroke="#cbd5e1"
    stroke-width="1.5"
  />
{/each}

