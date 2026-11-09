<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let { device, def, totalWidth, heightPx, poles }: Props = $props();
</script>

<!-- Recessed Front Faceplate (standard 45mm DIN opening) -->
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
  fill={def.colorAccent || "#64748b"}
/>

<!-- Custom circuit label -->
<text
  x={totalWidth / 2}
  y={heightPx * 0.32}
  text-anchor="middle"
  font-size={totalWidth < 50 ? "9" : "10"}
  font-weight="bold"
  fill="#0f172a"
  class="font-sans"
>
  {device.customLabel || def.name.split(" ")[0]}
</text>

<!-- Amperage & Curve Rating (e.g. C20, 63A) -->
<text
  x={totalWidth / 2}
  y={heightPx * 0.4}
  text-anchor="middle"
  font-size="10"
  font-weight="bold"
  fill="#1e293b"
  class="font-mono"
>
  {#if device.curve}{device.curve}{/if}{device.ratedAmps
    ? `${device.ratedAmps}A`
    : ""}
</text>

<!-- Breaking capacity box [6000] -->
{#if def.breakingCapacityKa}
  <rect
    x={totalWidth / 2 - 14}
    y={heightPx * 0.43}
    width="28"
    height="11"
    rx="1"
    fill="none"
    stroke="#64748b"
    stroke-width="0.8"
  />
  <text
    x={totalWidth / 2}
    y={heightPx * 0.43 + 8.5}
    text-anchor="middle"
    font-size="7.5"
    font-family="monospace"
    fill="#475569"
  >
    {def.breakingCapacityKa * 1000}
  </text>
{/if}

<!-- Toggle Switch Levers -->
<g class="toggles" transform="translate(0, {heightPx * 0.54})">
  {#each Array(poles) as _, p}
    {@const poleWidth = totalWidth / poles}
    {@const toggleX = p * poleWidth + poleWidth / 2}
    <!-- Toggle track -->
    <rect
      x={toggleX - 5}
      y="0"
      width="10"
      height="18"
      rx="2"
      fill="#334155"
    />
    <!-- Toggle lever (UP = ON) -->
    <rect
      x={toggleX - 4}
      y="1"
      width="8"
      height="9"
      rx="1"
      fill={def.colorAccent || "#0284c7"}
      stroke="#0f172a"
      stroke-width="0.5"
    />
  {/each}

  <!-- Handle tie across multiple poles -->
  {#if poles > 1}
    <rect
      x={totalWidth * 0.15}
      y="2"
      width={totalWidth * 0.7}
      height="4"
      rx="1"
      fill="#1e293b"
    />
  {/if}
</g>

<!-- RCD / RCBO Test Button -->
{#if def.hasTestButton}
  <g
    transform="translate({totalWidth * 0.75}, {heightPx * 0.41})"
    class="test-button"
  >
    <circle r="5" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1" />
    <text
      x="0"
      y="3"
      text-anchor="middle"
      font-size="7"
      font-weight="bold"
      fill="#0284c7"
    >
      T
    </text>
  </g>
{/if}

<!-- Trip status indicator window -->
{#if def.hasTripWindow}
  <rect
    x={totalWidth * 0.2}
    y={heightPx * 0.47}
    width="8"
    height="4"
    rx="1"
    fill="#dc2626"
    stroke="#64748b"
    stroke-width="0.5"
  />
{/if}

<!-- Circuit description at bottom of faceplate -->
<text
  x={totalWidth / 2}
  y={heightPx * 0.73}
  text-anchor="middle"
  font-size="7.5"
  fill="#64748b"
  class="truncate select-none"
>
  {device.circuitDescription
    ? device.circuitDescription.length > 14
      ? device.circuitDescription.substring(0, 12) + ".."
      : device.circuitDescription
    : ""}
</text>

