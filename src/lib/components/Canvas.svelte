<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import { getGaugeDef, getWireColor } from '#lib/wireStandards';
  import DeviceItem from './DeviceItem.svelte';

  const MODULE_WIDTH_PX = 44;
  const DEVICE_HEIGHT_PX = 160;
  const RAIL_SPACING_PX = 230;
  const PADDING_X = 60;
  const PADDING_Y = 100;

  let svgElement: SVGSVGElement | null = $state(null);
  let isPanning = $state(false);
  let panStartX = $state(0);
  let panStartY = $state(0);

  // Dragging device state
  let draggingDeviceId = $state<string | null>(null);
  let dragHoverRail = $state<number | null>(null);
  let dragHoverSlot = $state<number | null>(null);

  // Sizing
  const railWidthPx = $derived(panelStore.config.slotsPerRow * MODULE_WIDTH_PX);
  const panelTotalWidth = $derived(railWidthPx + PADDING_X * 2);
  const panelTotalHeight = $derived(
    panelStore.config.rows * RAIL_SPACING_PX + PADDING_Y * 2
  );

  // Calculate terminal absolute canvas coordinates
  function getTerminalCoords(deviceId: string, terminalId: string): { x: number; y: number } | null {
    if (deviceId === 'PE_BAR') {
      const index = parseInt(terminalId.replace('G_', '')) || 1;
      const x = PADDING_X + (index - 0.5) * (railWidthPx / panelStore.config.groundBarSlots);
      const y = PADDING_Y - 45;
      return { x, y };
    }

    if (deviceId === 'N_BAR') {
      const index = parseInt(terminalId.replace('N_', '')) || 1;
      const x = PADDING_X + (index - 0.5) * (railWidthPx / panelStore.config.neutralBarSlots);
      const y = panelTotalHeight - PADDING_Y + 45;
      return { x, y };
    }

    const device = panelStore.devices.find((d) => d.id === deviceId);
    if (!device) return null;
    const def = getDeviceDef(device.typeId);
    if (!def) return null;

    const term = def.terminals.find((t) => t.id === terminalId);
    if (!term) return null;

    const railY = PADDING_Y + device.railIndex * RAIL_SPACING_PX;
    const devX = PADDING_X + device.slotIndex * MODULE_WIDTH_PX;
    const termX = devX + (term.slotOffset + 0.5) * MODULE_WIDTH_PX;
    const termY = railY + (term.position === 'top' ? 12 : DEVICE_HEIGHT_PX - 14);

    return { x: termX, y: termY };
  }

  // Generate SVG wire path
  function generateWirePath(x1: number, y1: number, x2: number, y2: number, mode: 'curved' | 'orthogonal' = 'curved'): string {
    if (mode === 'orthogonal') {
      // Route through horizontal duct channel
      const midY = (y1 + y2) / 2;
      return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
    }

    // Smooth CAD bezier with realistic wire slack
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const sag = Math.min(Math.max(dist * 0.25, 25), 100);

    // If both terminals are at the top or both at the bottom
    const cy1 = y1 > y2 ? y1 - sag : y1 + sag;
    const cy2 = y2 > y1 ? y2 - sag : y2 + sag;

    return `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`;
  }

  // Pan / Zoom events
  function handleMouseDown(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.altKey) || panelStore.activeTool === 'select' && (e.target as HTMLElement).tagName === 'svg') {
      isPanning = true;
      panStartX = e.clientX - panelStore.pan.x;
      panStartY = e.clientY - panelStore.pan.y;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isPanning) {
      panelStore.pan.x = e.clientX - panStartX;
      panelStore.pan.y = e.clientY - panStartY;
      return;
    }

    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
    const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;

    // Update wire drafting rubber-band
    if (panelStore.wireDraft) {
      panelStore.updateWireDraftPoint(rawX, rawY);
    }

    // Update drag hover slot
    if (draggingDeviceId || panelStore.pendingPlaceTypeId) {
      const railIdx = Math.floor((rawY - PADDING_Y) / RAIL_SPACING_PX);
      const slotIdx = Math.floor((rawX - PADDING_X) / MODULE_WIDTH_PX);
      if (railIdx >= 0 && railIdx < panelStore.config.rows && slotIdx >= 0 && slotIdx < panelStore.config.slotsPerRow) {
        dragHoverRail = railIdx;
        dragHoverSlot = slotIdx;
      } else {
        dragHoverRail = null;
        dragHoverSlot = null;
      }
    }
  }

  function handleMouseUp() {
    isPanning = false;

    // If placing from catalog
    if (panelStore.pendingPlaceTypeId && dragHoverRail !== null && dragHoverSlot !== null) {
      panelStore.placeDevice(panelStore.pendingPlaceTypeId, dragHoverRail, dragHoverSlot);
      panelStore.pendingPlaceTypeId = null;
    }

    // If moving existing device
    if (draggingDeviceId && dragHoverRail !== null && dragHoverSlot !== null) {
      panelStore.moveDevice(draggingDeviceId, dragHoverRail, dragHoverSlot);
      draggingDeviceId = null;
    }

    dragHoverRail = null;
    dragHoverSlot = null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(panelStore.zoom * zoomFactor, 0.4), 2.5);
    panelStore.zoom = Number(newZoom.toFixed(2));
  }

  // Terminal click handler
  function handleTerminalMouseDown(deviceId: string, terminalId: string, e: MouseEvent) {
    const coords = getTerminalCoords(deviceId, terminalId);
    if (!coords) return;

    if (!panelStore.wireDraft) {
      // Start wire draft
      panelStore.startWireDraft(deviceId, terminalId, coords.x, coords.y);
    } else {
      // Complete wire connection
      panelStore.completeWireDraft(deviceId, terminalId);
    }
  }

  // Canvas background click cancels wire draft / clears selection
  function handleCanvasClick(e: MouseEvent) {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'enclosure-bg') {
      if (panelStore.wireDraft) {
        panelStore.cancelWireDraft();
      } else {
        panelStore.clearSelection();
      }
    }
  }
</script>

<div
  class="relative w-full h-full overflow-hidden bg-slate-900 select-none cursor-default"
  onwheel={handleWheel}
  role="region"
  aria-label="Circuit Breaker Canvas"
>
  <svg
    bind:this={svgElement}
    class="w-full h-full"
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onclick={handleCanvasClick}
    role="application"
  >
    <!-- Background Grid Pattern -->
    <defs>
      <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.8" />
      </pattern>
      <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="url(#smallGrid)" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" stroke-width="1.2" />
      </pattern>
      <!-- Drop shadow for breakers -->
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.25" />
      </filter>
    </defs>

    <!-- Canvas Transform Layer -->
    <g transform="translate({panelStore.pan.x}, {panelStore.pan.y}) scale({panelStore.zoom})">
      <!-- Grid background -->
      <rect
        x="-1000"
        y="-1000"
        width="4000"
        height="4000"
        fill="url(#grid)"
        opacity="0.6"
      />

      <!-- Enclosure Box Body -->
      <rect
        id="enclosure-bg"
        x={PADDING_X - 30}
        y={PADDING_Y - 70}
        width={railWidthPx + 60}
        height={panelTotalHeight - PADDING_Y + 60}
        rx="14"
        fill="#0f172a"
        stroke="#475569"
        stroke-width="3"
        class="filter drop-shadow-2xl"
      />

      <!-- Enclosure Title / Header Label -->
      <text
        x={PADDING_X}
        y={PADDING_Y - 50}
        font-size="12"
        font-weight="bold"
        fill="#94a3b8"
        class="font-mono tracking-wider uppercase"
      >
        {panelStore.config.name} ({panelStore.config.slotsPerRow}M × {panelStore.config.rows} Rows)
      </text>

      <!-- TOP GROUND (PE) BRASS BUSBAR STRIP -->
      {#if panelStore.config.hasGroundBar}
        <g class="ground-bar" transform="translate({PADDING_X}, {PADDING_Y - 50})">
          <!-- Brass Bar Base -->
          <rect
            x="0"
            y="0"
            width={railWidthPx}
            height="16"
            rx="2"
            fill="#eab308"
            stroke="#ca8a04"
            stroke-width="1.5"
          />
          <text
            x="-40"
            y="12"
            font-size="10"
            font-weight="bold"
            fill="#22c55e"
            class="font-mono"
          >
            PE BAR
          </text>
          <!-- Ground bar terminal screw holes -->
          {#each Array(panelStore.config.groundBarSlots) as _, idx}
            {@const holeX = (idx + 0.5) * (railWidthPx / panelStore.config.groundBarSlots)}
            <g
              class="terminal-pe cursor-pointer group"
              transform="translate({holeX}, 8)"
              onmousedown={(e) => handleTerminalMouseDown('PE_BAR', `G_${idx + 1}`, e)}
              role="button"
              tabindex="0"
            >
              <circle
                r="5"
                fill="#854d0e"
                stroke="#fef08a"
                stroke-width="1"
                class="group-hover:scale-125 transition-transform"
              />
              <circle r="2.5" fill="#15803d" />
            </g>
          {/each}
        </g>
      {/if}

      <!-- BOTTOM NEUTRAL (N) BRASS BUSBAR STRIP -->
      {#if panelStore.config.hasNeutralBar}
        <g class="neutral-bar" transform="translate({PADDING_X}, {panelTotalHeight - PADDING_Y + 40})">
          <!-- Brass Bar Base -->
          <rect
            x="0"
            y="0"
            width={railWidthPx}
            height="16"
            rx="2"
            fill="#94a3b8"
            stroke="#64748b"
            stroke-width="1.5"
          />
          <text
            x="-40"
            y="12"
            font-size="10"
            font-weight="bold"
            fill="#38bdf8"
            class="font-mono"
          >
            N BAR
          </text>
          <!-- Neutral bar terminal screw holes -->
          {#each Array(panelStore.config.neutralBarSlots) as _, idx}
            {@const holeX = (idx + 0.5) * (railWidthPx / panelStore.config.neutralBarSlots)}
            <g
              class="terminal-n cursor-pointer group"
              transform="translate({holeX}, 8)"
              onmousedown={(e) => handleTerminalMouseDown('N_BAR', `N_${idx + 1}`, e)}
              role="button"
              tabindex="0"
            >
              <circle
                r="5"
                fill="#475569"
                stroke="#e2e8f0"
                stroke-width="1"
                class="group-hover:scale-125 transition-transform"
              />
              <circle r="2.5" fill="#0284c7" />
            </g>
          {/each}
        </g>
      {/if}

      <!-- DIN RAILS & SLOTS -->
      {#each Array(panelStore.config.rows) as _, r}
        {@const railY = PADDING_Y + r * RAIL_SPACING_PX}
        <g class="din-rail-row">
          <!-- DIN Rail Steel Channel -->
          <rect
            x={PADDING_X - 10}
            y={railY + DEVICE_HEIGHT_PX * 0.35}
            width={railWidthPx + 20}
            height="35"
            rx="2"
            fill="#334155"
            stroke="#64748b"
            stroke-width="1.5"
          />
          <!-- Metal DIN Rail center groove and slots -->
          <line
            x1={PADDING_X - 10}
            y1={railY + DEVICE_HEIGHT_PX * 0.35 + 8}
            x2={PADDING_X + railWidthPx + 10}
            y2={railY + DEVICE_HEIGHT_PX * 0.35 + 8}
            stroke="#1e293b"
            stroke-width="2"
          />
          <line
            x1={PADDING_X - 10}
            y1={railY + DEVICE_HEIGHT_PX * 0.35 + 27}
            x2={PADDING_X + railWidthPx + 10}
            y2={railY + DEVICE_HEIGHT_PX * 0.35 + 27}
            stroke="#1e293b"
            stroke-width="2"
          />

          <!-- Slot grid ticks & numbers -->
          {#each Array(panelStore.config.slotsPerRow) as _, s}
            {@const slotX = PADDING_X + s * MODULE_WIDTH_PX}
            <line
              x1={slotX}
              y1={railY - 6}
              x2={slotX}
              y2={railY + DEVICE_HEIGHT_PX + 6}
              stroke="#334155"
              stroke-dasharray="2,4"
              stroke-width="1"
            />
            <text
              x={slotX + MODULE_WIDTH_PX / 2}
              y={railY - 10}
              text-anchor="middle"
              font-size="8.5"
              font-family="monospace"
              fill="#64748b"
            >
              {s + 1}
            </text>
          {/each}
          <!-- End tick of rail -->
          <line
            x1={PADDING_X + railWidthPx}
            y1={railY - 6}
            x2={PADDING_X + railWidthPx}
            y2={railY + DEVICE_HEIGHT_PX + 6}
            stroke="#334155"
            stroke-dasharray="2,4"
          />
        </g>
      {/each}

      <!-- PLACED COMB BUSBARS (Manual placement) -->
      {#each panelStore.busbars as busbar}
        {@const railY = PADDING_Y + busbar.railIndex * RAIL_SPACING_PX}
        {@const barX = PADDING_X + busbar.startSlot * MODULE_WIDTH_PX}
        {@const barWidth = busbar.slotSpan * MODULE_WIDTH_PX}
        {@const barY = busbar.position === 'top' ? railY - 14 : railY + DEVICE_HEIGHT_PX + 4}
        {@const isSelected = panelStore.selectedType === 'busbar' && panelStore.selectedId === busbar.id}

        <g
          class="comb-busbar cursor-pointer group"
          onclick={(e) => {
            e.stopPropagation();
            panelStore.select('busbar', busbar.id);
          }}
          role="button"
          tabindex="0"
        >
          <!-- Busbar Insulation Bar -->
          <rect
            x={barX + 2}
            y={barY}
            width={barWidth - 4}
            height="10"
            rx="2"
            fill={isSelected ? '#3b82f6' : '#e2e8f0'}
            stroke={isSelected ? '#1d4ed8' : '#94a3b8'}
            stroke-width="1.5"
            class="filter drop-shadow-md"
          />
          <text
            x={barX + barWidth / 2}
            y={barY + 7.5}
            text-anchor="middle"
            font-size="7"
            font-weight="bold"
            fill="#0f172a"
          >
            {busbar.busbarType} COMB BUSBAR
          </text>
          <!-- Copper prongs into breaker terminals -->
          {#each Array(busbar.slotSpan) as _, p}
            {@const prongX = barX + (p + 0.5) * MODULE_WIDTH_PX}
            <rect
              x={prongX - 2.5}
              y={busbar.position === 'top' ? barY + 9 : barY - 8}
              width="5"
              height="8"
              fill="#d97706"
              stroke="#b45309"
              stroke-width="0.5"
            />
          {/each}
        </g>
      {/each}

      <!-- PLACED DEVICES -->
      {#each panelStore.devices as device}
        {@const devX = PADDING_X + device.slotIndex * MODULE_WIDTH_PX}
        {@const devY = PADDING_Y + device.railIndex * RAIL_SPACING_PX}
        <DeviceItem
          {device}
          x={devX}
          y={devY}
          moduleWidthPx={MODULE_WIDTH_PX}
          heightPx={DEVICE_HEIGHT_PX}
          onTerminalMouseDown={handleTerminalMouseDown}
        />
      {/each}

      <!-- ROUTED WIRES -->
      {#each panelStore.wires as wire}
        {@const src = getTerminalCoords(wire.sourceDeviceId, wire.sourceTerminalId)}
        {@const tgt = getTerminalCoords(wire.targetDeviceId, wire.targetTerminalId)}
        {#if src && tgt}
          {@const gauge = getGaugeDef(wire.gaugeMetric)}
          {@const isSelected = panelStore.selectedType === 'wire' && panelStore.selectedId === wire.id}
          {@const pathD = generateWirePath(src.x, src.y, tgt.x, tgt.y, wire.routingMode || 'curved')}

          <g
            class="wire-group cursor-pointer group"
            onclick={(e) => {
              e.stopPropagation();
              panelStore.select('wire', wire.id);
            }}
            role="button"
            tabindex="0"
          >
            <!-- Wire Glow / Selection Halo -->
            <path
              d={pathD}
              fill="none"
              stroke={isSelected ? '#38bdf8' : 'transparent'}
              stroke-width={gauge.renderWidth + 6}
              stroke-linecap="round"
              class="group-hover:stroke-blue-400 group-hover:stroke-opacity-50 transition-all"
            />

            <!-- Wire Outer Core -->
            <path
              d={pathD}
              fill="none"
              stroke={wire.color}
              stroke-width={gauge.renderWidth}
              stroke-linecap="round"
              class="filter drop-shadow"
            />

            <!-- Secondary stripe for Green/Yellow ground wires -->
            {#if wire.role === 'earth' && wire.standard === 'IEC'}
              <path
                d={pathD}
                fill="none"
                stroke="#facc15"
                stroke-width={gauge.renderWidth * 0.4}
                stroke-dasharray="10,10"
                stroke-linecap="round"
              />
            {/if}

            <!-- Source & Target Terminal Ring Caps -->
            <circle cx={src.x} cy={src.y} r="3" fill="#ffffff" stroke={wire.color} stroke-width="1.5" />
            <circle cx={tgt.x} cy={tgt.y} r="3" fill="#ffffff" stroke={wire.color} stroke-width="1.5" />
          </g>
        {/if}
      {/each}

      <!-- RUBBERBAND WIRE DRAFT (Active mouse connection) -->
      {#if panelStore.wireDraft}
        {@const srcCoords = getTerminalCoords(panelStore.wireDraft.sourceDeviceId, panelStore.wireDraft.sourceTerminalId)}
        {#if srcCoords}
          {@const draftGauge = getGaugeDef(panelStore.activeWireGauge)}
          {@const draftColor = getWireColor(panelStore.activeWireRole, panelStore.config.wireStandard)}
          {@const draftPath = generateWirePath(
            srcCoords.x,
            srcCoords.y,
            panelStore.wireDraft.currentX,
            panelStore.wireDraft.currentY,
            panelStore.activeWireRouting
          )}
          <path
            d={draftPath}
            fill="none"
            stroke={draftColor.hex}
            stroke-width={draftGauge.renderWidth}
            stroke-dasharray="6,4"
            class="animate-pulse"
          />
          <circle cx={srcCoords.x} cy={srcCoords.y} r="4" fill="#3b82f6" />
          <circle cx={panelStore.wireDraft.currentX} cy={panelStore.wireDraft.currentY} r="5" fill="#60a5fa" />
        {/if}
      {/if}

      <!-- DROP TARGET HIGHLIGHT (When hovering over a slot) -->
      {#if dragHoverRail !== null && dragHoverSlot !== null}
        {@const hoverX = PADDING_X + dragHoverSlot * MODULE_WIDTH_PX}
        {@const hoverY = PADDING_Y + dragHoverRail * RAIL_SPACING_PX}
        <rect
          x={hoverX}
          y={hoverY}
          width={MODULE_WIDTH_PX}
          height={DEVICE_HEIGHT_PX}
          rx="4"
          fill="#3b82f6"
          fill-opacity="0.25"
          stroke="#60a5fa"
          stroke-width="2"
          stroke-dasharray="4,4"
        />
      {/if}
    </g>
  </svg>

  <!-- Canvas Quick Zoom & Reset Floating Controls -->
  <div class="absolute bottom-4 left-4 flex items-center gap-1.5 bg-slate-800/90 backdrop-blur border border-slate-700 p-1.5 rounded-lg shadow-xl text-slate-300">
    <button
      class="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition font-mono font-semibold"
      onclick={() => panelStore.zoom = Math.max(0.4, Number((panelStore.zoom - 0.1).toFixed(2)))}
      title="Zoom Out"
    >
      -
    </button>
    <span class="text-xs font-mono px-1 min-w-12 text-center text-slate-400">
      {Math.round(panelStore.zoom * 100)}%
    </span>
    <button
      class="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition font-mono font-semibold"
      onclick={() => panelStore.zoom = Math.min(2.5, Number((panelStore.zoom + 0.1).toFixed(2)))}
      title="Zoom In"
    >
      +
    </button>
    <div class="w-px h-4 bg-slate-700 mx-0.5"></div>
    <button
      class="px-2 py-1 text-xs hover:bg-slate-700 rounded transition text-slate-400 hover:text-slate-200"
      onclick={() => {
        panelStore.zoom = 1.0;
        panelStore.pan = { x: 40, y: 40 };
      }}
      title="Reset View"
    >
      Reset
    </button>
  </div>
</div>

