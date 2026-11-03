<script lang="ts">
  import type { PlacedDevice, TerminalDef } from '#lib/types';
  import { getDeviceDef } from '#lib/catalog';
  import { panelStore } from '#lib/state.svelte';

  interface Props {
    device: PlacedDevice;
    x: number;
    y: number;
    moduleWidthPx?: number;
    heightPx?: number;
    onTerminalMouseDown?: (deviceId: string, terminalId: string, event: MouseEvent) => void;
  }

  let {
    device,
    x,
    y,
    moduleWidthPx = 44,
    heightPx = 160,
    onTerminalMouseDown
  }: Props = $props();

  const def = $derived(getDeviceDef(device.typeId));
  const isSelected = $derived(
    panelStore.selectedType === 'device' && panelStore.selectedId === device.id
  );

  const totalWidth = $derived(device.widthModules * moduleWidthPx);
  const poles = $derived(def?.poles || 1);

  // Group terminals by top and bottom
  const topTerminals = $derived(def?.terminals.filter((t) => t.position === 'top') || []);
  const bottomTerminals = $derived(def?.terminals.filter((t) => t.position === 'bottom') || []);

  function handleDeviceClick(e: MouseEvent) {
    e.stopPropagation();
    if (panelStore.activeTool === 'select') {
      panelStore.select('device', device.id);
    }
  }

  function handleTerminalClick(term: TerminalDef, e: MouseEvent) {
    e.stopPropagation();
    if (onTerminalMouseDown) {
      onTerminalMouseDown(device.id, term.id, e);
    }
  }
</script>

<g
  class="device-item cursor-pointer select-none transition-transform"
  transform="translate({x}, {y})"
  onclick={handleDeviceClick}
  role="button"
  tabindex="0"
>
  <!-- Outer Enclosure / DIN Box body -->
  <rect
    x="1"
    y="1"
    width={totalWidth - 2}
    height={heightPx - 2}
    rx="4"
    fill="#f8fafc"
    stroke={isSelected ? '#2563eb' : '#94a3b8'}
    stroke-width={isSelected ? 3 : 1.5}
    class="filter drop-shadow-sm hover:stroke-blue-400"
  />

  <!-- Internal slot dividers for multi-module devices -->
  {#if device.widthModules > 1}
    {#each Array(device.widthModules - 1) as _, i}
      <line
        x1={(i + 1) * moduleWidthPx}
        y1="2"
        x2={(i + 1) * moduleWidthPx}
        y2={heightPx - 2}
        stroke="#cbd5e1"
        stroke-dasharray="3,3"
      />
    {/each}
  {/if}

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
    fill={def?.colorAccent || '#64748b'}
  />

  <!-- Breaker Ratings & Labels -->
  {#if def?.category !== 'accessory'}
    <!-- Custom circuit label -->
    <text
      x={totalWidth / 2}
      y={heightPx * 0.32}
      text-anchor="middle"
      font-size={totalWidth < 50 ? '9' : '10'}
      font-weight="bold"
      fill="#0f172a"
      class="font-sans"
    >
      {device.customLabel || def?.name.split(' ')[0]}
    </text>

    <!-- Amperage & Curve Rating (e.g. C20, 63A) -->
    <text
      x={totalWidth / 2}
      y={heightPx * 0.40}
      text-anchor="middle"
      font-size="10"
      font-weight="bold"
      fill="#1e293b"
      class="font-mono"
    >
      {#if device.curve}{device.curve}{/if}{device.ratedAmps ? `${device.ratedAmps}A` : ''}
    </text>

    <!-- Breaking capacity box [6000] -->
    {#if def?.breakingCapacityKa}
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
          fill={def?.colorAccent || '#0284c7'}
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
    {#if def?.hasTestButton}
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
    {#if def?.hasTripWindow}
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
      {device.circuitDescription ? (device.circuitDescription.length > 14 ? device.circuitDescription.substring(0, 12) + '..' : device.circuitDescription) : ''}
    </text>
  {:else}
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
  {/if}

  <!-- TOP TERMINALS -->
  {#each topTerminals as term}
    {@const termX = (term.slotOffset + 0.5) * moduleWidthPx}
    {@const termY = 12}
    <g
      class="terminal terminal-top cursor-pointer group"
      transform="translate({termX}, {termY})"
      onmousedown={(e) => handleTerminalClick(term, e)}
      role="button"
      tabindex="0"
    >
      <!-- Screw / Terminal Housing -->
      <circle
        r="8"
        fill="#e2e8f0"
        stroke="#64748b"
        stroke-width="1.5"
        class="transition-all group-hover:stroke-blue-500 group-hover:scale-125"
      />
      <!-- Screw Slot -->
      <line x1="-4" y1="-3" x2="4" y2="3" stroke="#475569" stroke-width="1.5" />
      
      <!-- Interactive Click Dot -->
      <circle
        r="4"
        fill="#3b82f6"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
      />
      
      <!-- Terminal Label -->
      <text
        x="0"
        y="18"
        text-anchor="middle"
        font-size="7"
        font-weight="bold"
        fill="#475569"
      >
        {term.label}
      </text>
    </g>
  {/each}

  <!-- BOTTOM TERMINALS -->
  {#each bottomTerminals as term}
    {@const termX = (term.slotOffset + 0.5) * moduleWidthPx}
    {@const termY = heightPx - 14}
    <g
      class="terminal terminal-bottom cursor-pointer group"
      transform="translate({termX}, {termY})"
      onmousedown={(e) => handleTerminalClick(term, e)}
      role="button"
      tabindex="0"
    >
      <!-- Terminal Label -->
      <text
        x="0"
        y="-10"
        text-anchor="middle"
        font-size="7"
        font-weight="bold"
        fill="#475569"
      >
        {term.label}
      </text>

      <!-- Screw / Terminal Housing -->
      <circle
        r="8"
        fill="#e2e8f0"
        stroke="#64748b"
        stroke-width="1.5"
        class="transition-all group-hover:stroke-blue-500 group-hover:scale-125"
      />
      <!-- Screw Slot -->
      <line x1="-4" y1="-3" x2="4" y2="3" stroke="#475569" stroke-width="1.5" />

      <!-- Interactive Click Dot -->
      <circle
        r="4"
        fill="#3b82f6"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </g>
  {/each}
</g>

