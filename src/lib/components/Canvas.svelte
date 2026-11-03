<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import { getGaugeDef, getWireColor } from '#lib/wireStandards';
  import type { WirePoint } from '#lib/types';
  import DeviceItem from './DeviceItem.svelte';

  const MODULE_WIDTH_PX = 44;
  const DEVICE_HEIGHT_PX = 160;
  const PADDING_X = 60;
  const PADDING_Y = 120;

  let svgElement: SVGSVGElement | null = $state(null);
  let isPanning = $state(false);
  let panStartX = $state(0);
  let panStartY = $state(0);

  // Dragging device state
  let draggingDeviceId = $state<string | null>(null);
  let dragHoverRail = $state<number | null>(null);
  let dragHoverSlot = $state<number | null>(null);

  // Dragging waypoint state
  let draggingWaypoint = $state<{ wireId: string; nodeIndex: number } | null>(null);

  // Dragging detached field block state
  let draggingFieldBlockId = $state<string | null>(null);
  let fieldBlockDragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sizing & Spacing
  const railSpacing = $derived(panelStore.config.railSpacing || 230);
  const railWidthPx = $derived(panelStore.config.slotsPerRow * MODULE_WIDTH_PX);
  const panelTotalWidth = $derived(railWidthPx + PADDING_X * 2);
  const panelTotalHeight = $derived(
    panelStore.config.rows * railSpacing + PADDING_Y * 2
  );

  // Calculate terminal absolute canvas coordinates
  function getTerminalCoords(
    deviceId: string,
    terminalId: string
  ): { x: number; y: number; position: 'top' | 'bottom' } | null {
    if (deviceId === 'PE_BAR') {
      const index = parseInt(terminalId.replace('G_', '')) || 1;
      const x = PADDING_X + (index - 0.5) * (railWidthPx / panelStore.config.groundBarSlots);
      const y = PADDING_Y - 40;
      return { x, y, position: 'top' };
    }

    if (deviceId === 'N_BAR') {
      const index = parseInt(terminalId.replace('N_', '')) || 1;
      const x = PADDING_X + (index - 0.5) * (railWidthPx / panelStore.config.neutralBarSlots);
      const y = panelTotalHeight - PADDING_Y + 44;
      return { x, y, position: 'bottom' };
    }

    // Detached Field Block
    const fb = panelStore.fieldBlocks.find((b) => b.id === deviceId);
    if (fb) {
      const termPos = fb.terminalPosition || 'top';
      const w = fb.width || 88;
      const h = fb.height || 76;
      const termY = termPos === 'top' ? fb.y + 14 : fb.y + h - 14;
      const termX = terminalId === '1' || terminalId === 'L' ? fb.x + 24 : fb.x + w - 24;
      return { x: termX, y: termY, position: termPos };
    }

    const device = panelStore.devices.find((d) => d.id === deviceId);
    if (!device) return null;
    const def = getDeviceDef(device.typeId);
    if (!def) return null;

    const term = def.terminals.find((t) => t.id === terminalId);
    if (!term) return null;

    const railY = PADDING_Y + device.railIndex * railSpacing;
    const devX = PADDING_X + device.slotIndex * MODULE_WIDTH_PX;
    const termX = devX + term.slotOffset * MODULE_WIDTH_PX;
    const termY = railY + (term.yOffset !== undefined ? term.yOffset : (term.position === 'top' ? 12 : DEVICE_HEIGHT_PX - 14));

    return { x: termX, y: termY, position: term.position };
  }

  // Generate SVG wire path with orthogonal right angles and nodes
  function generateWirePath(
    src: { x: number; y: number; position?: 'top' | 'bottom' },
    tgt: { x: number; y: number; position?: 'top' | 'bottom' },
    waypoints: WirePoint[] = [],
    mode: 'curved' | 'orthogonal' = 'orthogonal'
  ): string {
    const x1 = src.x;
    const y1 = src.y;
    const x2 = tgt.x;
    const y2 = tgt.y;

    if (mode === 'curved') {
      if (waypoints.length === 0) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const sag = Math.min(Math.max(dist * 0.25, 25), 100);
        const cy1 = y1 > y2 ? y1 - sag : y1 + sag;
        const cy2 = y2 > y1 ? y2 - sag : y2 + sag;
        return `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`;
      } else {
        let d = `M ${x1} ${y1}`;
        const pts = [{ x: x1, y: y1 }, ...waypoints, { x: x2, y: y2 }];
        for (let i = 0; i < pts.length - 1; i++) {
          const pA = pts[i];
          const pB = pts[i + 1];
          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2;
          d += ` Q ${pA.x} ${pA.y}, ${midX} ${midY}`;
        }
        d += ` L ${x2} ${y2}`;
        return d;
      }
    }

    // ORTHOGONAL (RIGHT ANGLE) ROUTING
    if (waypoints.length === 0) {
      if (src.position === 'top' && tgt.position === 'top' && Math.abs(y1 - y2) < 30) {
        const gutterY = Math.min(y1, y2) - 30;
        return `M ${x1} ${y1} L ${x1} ${gutterY} L ${x2} ${gutterY} L ${x2} ${y2}`;
      } else if (src.position === 'bottom' && tgt.position === 'bottom' && Math.abs(y1 - y2) < 30) {
        const gutterY = Math.max(y1, y2) + 30;
        return `M ${x1} ${y1} L ${x1} ${gutterY} L ${x2} ${gutterY} L ${x2} ${y2}`;
      } else {
        const midY = Math.round((y1 + y2) / 2);
        return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      }
    }

    // WITH USER WAYPOINT NODES
    // Start -> W0 -> W1 ... -> End
    // Every waypoint node acts as a right-angle vertex!
    let path = `M ${x1} ${y1}`;
    const allPoints = [{ x: x1, y: y1 }, ...waypoints, { x: x2, y: y2 }];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const cur = allPoints[i];
      const nxt = allPoints[i + 1];

      if (cur.x === nxt.x || cur.y === nxt.y) {
        path += ` L ${nxt.x} ${nxt.y}`;
      } else {
        if (i === 0) {
          // Leaving start terminal: exit vertically first
          path += ` L ${cur.x} ${nxt.y} L ${nxt.x} ${nxt.y}`;
        } else if (i === allPoints.length - 2) {
          // Entering target terminal: enter vertically
          path += ` L ${nxt.x} ${cur.y} L ${nxt.x} ${nxt.y}`;
        } else {
          // Node to node right angle
          path += ` L ${nxt.x} ${cur.y} L ${nxt.x} ${nxt.y}`;
        }
      }
    }

    return path;
  }

  // Pan / Zoom events
  function handleMouseDown(e: MouseEvent) {
    if (
      e.button === 1 ||
      (e.button === 0 && e.altKey) ||
      (panelStore.activeTool === 'select' && (e.target as HTMLElement).tagName === 'svg')
    ) {
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

    // Dragging waypoint node
    if (draggingWaypoint) {
      const snappedX = Math.round(rawX / 5) * 5;
      const snappedY = Math.round(rawY / 5) * 5;
      panelStore.updateWireWaypoint(
        draggingWaypoint.wireId,
        draggingWaypoint.nodeIndex,
        { x: snappedX, y: snappedY }
      );
      return;
    }

    // Dragging detached field block
    if (draggingFieldBlockId) {
      const fb = panelStore.fieldBlocks.find((b) => b.id === draggingFieldBlockId);
      if (fb) {
        fb.x = Math.round((rawX - fieldBlockDragOffset.x) / 5) * 5;
        fb.y = Math.round((rawY - fieldBlockDragOffset.y) / 5) * 5;
      }
      return;
    }

    // Update wire drafting rubber-band
    if (panelStore.wireDraft) {
      panelStore.updateWireDraftPoint(rawX, rawY);
    }

    // Update drag hover slot
    if (draggingDeviceId || panelStore.pendingPlaceTypeId) {
      const railIdx = Math.floor((rawY - PADDING_Y) / railSpacing);
      const slotIdx = Math.floor((rawX - PADDING_X) / MODULE_WIDTH_PX);
      if (
        railIdx >= 0 &&
        railIdx < panelStore.config.rows &&
        slotIdx >= 0 &&
        slotIdx < panelStore.config.slotsPerRow
      ) {
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

    if (draggingWaypoint) {
      draggingWaypoint = null;
    }

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

    if (draggingFieldBlockId) {
      draggingFieldBlockId = null;
      panelStore.saveToLocalStorage();
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

  // Field block drag start
  function handleFieldBlockMouseDown(id: string, e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    panelStore.select('field_block', id);
    const fb = panelStore.fieldBlocks.find((b) => b.id === id);
    if (!fb || !svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
    const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;
    draggingFieldBlockId = id;
    fieldBlockDragOffset = { x: rawX - fb.x, y: rawY - fb.y };
  }

  // Field block terminal click
  function handleFieldBlockTerminalMouseDown(fbId: string, terminalId: string, e: MouseEvent) {
    e.stopPropagation();
    const coords = getTerminalCoords(fbId, terminalId);
    if (!coords) return;

    if (!panelStore.wireDraft) {
      if (terminalId === '1' || terminalId === 'L') {
        panelStore.activeWireRole = 'line1';
      } else {
        panelStore.activeWireRole = panelStore.config.wireStandard === 'PEC' ? 'line2' : 'neutral';
      }
      panelStore.startWireDraft(fbId, terminalId, coords.x, coords.y);
    } else {
      panelStore.completeWireDraft(fbId, terminalId);
    }
  }

  // Terminal click handler
  function handleTerminalMouseDown(deviceId: string, terminalId: string, e: MouseEvent) {
    e.stopPropagation();
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

  // Handle double clicking wire to add waypoint node
  function handleWireDoubleClick(wireId: string, e: MouseEvent) {
    e.stopPropagation();
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
    const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;
    panelStore.addWireWaypoint(wireId, { x: Math.round(rawX), y: Math.round(rawY) });
  }

  // Waypoint node mouse down for dragging
  function handleWaypointMouseDown(wireId: string, nodeIndex: number, e: MouseEvent) {
    e.stopPropagation();
    panelStore.select('wire', wireId);
    draggingWaypoint = { wireId, nodeIndex };
  }

  // Canvas background click cancels wire draft / clears selection
  function handleCanvasClick(e: MouseEvent) {
    if (
      (e.target as HTMLElement).tagName === 'svg' ||
      (e.target as HTMLElement).id === 'enclosure-bg'
    ) {
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
        y={PADDING_Y - 95}
        width={railWidthPx + 60}
        height={panelTotalHeight - PADDING_Y * 2 + 165}
        rx="14"
        fill="#0f172a"
        stroke="#475569"
        stroke-width="3"
        class="filter drop-shadow-2xl"
      />

      <!-- Enclosure Title / Header Label -->
      <text
        x={PADDING_X}
        y={PADDING_Y - 68}
        font-size="12"
        font-weight="bold"
        fill="#94a3b8"
        class="font-mono tracking-wider uppercase"
      >
        {panelStore.config.name} ({panelStore.config.slotsPerRow}M × {panelStore.config.rows} Rows)
      </text>

      <!-- TOP GROUND (PE) BRASS BUSBAR STRIP -->
      {#if panelStore.config.hasGroundBar}
        <g class="ground-bar" transform="translate({PADDING_X}, {PADDING_Y - 48})">
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
            x="-44"
            y="12"
            font-size="10"
            font-weight="bold"
            fill="#22c55e"
            class="font-mono"
          >
            PE BAR
          </text>
          {#each Array(panelStore.config.groundBarSlots) as _, idx}
            {@const holeX = (idx + 0.5) * (railWidthPx / panelStore.config.groundBarSlots)}
            <g
              class="terminal-pe cursor-pointer group"
              transform="translate({holeX}, 8)"
              onmousedown={(e) => handleTerminalMouseDown('PE_BAR', `G_${idx + 1}`, e)}
              onclick={(e) => handleTerminalMouseDown('PE_BAR', `G_${idx + 1}`, e)}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
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
        <g class="neutral-bar" transform="translate({PADDING_X}, {panelTotalHeight - PADDING_Y + 36})">
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
            x="-44"
            y="12"
            font-size="10"
            font-weight="bold"
            fill="#38bdf8"
            class="font-mono"
          >
            N BAR
          </text>
          {#each Array(panelStore.config.neutralBarSlots) as _, idx}
            {@const holeX = (idx + 0.5) * (railWidthPx / panelStore.config.neutralBarSlots)}
            <g
              class="terminal-n cursor-pointer group"
              transform="translate({holeX}, 8)"
              onmousedown={(e) => handleTerminalMouseDown('N_BAR', `N_${idx + 1}`, e)}
              onclick={(e) => handleTerminalMouseDown('N_BAR', `N_${idx + 1}`, e)}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
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

      <!-- INTER-RAIL GUTTER DIMENSION GUIDES -->
      {#if panelStore.config.rows > 1}
        {#each Array(panelStore.config.rows - 1) as _, r}
          {@const gutterTopY = PADDING_Y + r * railSpacing + DEVICE_HEIGHT_PX}
          {@const gutterBottomY = PADDING_Y + (r + 1) * railSpacing}
          {@const gutterHeight = gutterBottomY - gutterTopY}
          {@const gutterMidY = (gutterTopY + gutterBottomY) / 2}

          <g class="gutter-guide select-none">
            <!-- Vertical dimension line on left gutter margin -->
            <line
              x1={PADDING_X - 26}
              y1={gutterTopY + 2}
              x2={PADDING_X - 26}
              y2={gutterBottomY - 2}
              stroke="#64748b"
              stroke-width="1.2"
              stroke-dasharray="3,3"
            />
            <!-- Top tick -->
            <line
              x1={PADDING_X - 32}
              y1={gutterTopY + 2}
              x2={PADDING_X - 20}
              y2={gutterTopY + 2}
              stroke="#64748b"
              stroke-width="1.5"
            />
            <!-- Bottom tick -->
            <line
              x1={PADDING_X - 32}
              y1={gutterBottomY - 2}
              x2={PADDING_X - 20}
              y2={gutterBottomY - 2}
              stroke="#64748b"
              stroke-width="1.5"
            />

            <!-- Gutter height readout pill -->
            <rect
              x={PADDING_X - 52}
              y={gutterMidY - 9}
              width="50"
              height="18"
              rx="4"
              fill="#0f172a"
              stroke="#334155"
              stroke-width="1"
            />
            <text
              x={PADDING_X - 27}
              y={gutterMidY + 3.5}
              text-anchor="middle"
              font-size="8.5"
              font-family="monospace"
              font-weight="bold"
              fill="#38bdf8"
            >
              {gutterHeight}px
            </text>
          </g>
        {/each}
      {/if}

      <!-- DIN RAILS & SLOTS -->
      {#each Array(panelStore.config.rows) as _, r}
        {@const railY = PADDING_Y + r * railSpacing}
        <g class="din-rail-row">
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

      <!-- PLACED COMB BUSBARS -->
      {#each panelStore.busbars as busbar}
        {@const railY = PADDING_Y + busbar.railIndex * railSpacing}
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
        {@const devY = PADDING_Y + device.railIndex * railSpacing}
        <DeviceItem
          {device}
          x={devX}
          y={devY}
          moduleWidthPx={MODULE_WIDTH_PX}
          heightPx={DEVICE_HEIGHT_PX}
          onTerminalMouseDown={handleTerminalMouseDown}
        />
      {/each}

      <!-- DETACHED FREESTANDING FIELD BLOCKS (OFF-RAIL) -->
      {#each panelStore.fieldBlocks as fb}
        {@const isSelected = panelStore.selectedType === 'field_block' && panelStore.selectedId === fb.id}
        {@const w = fb.width || 88}
        {@const h = fb.height || 76}
        {@const isTop = fb.terminalPosition !== 'bottom'}
        {@const termY = isTop ? 14 : h - 14}
        {@const words = fb.label.split(' ')}
        {@const line1 = words.length > 1 && fb.label.length > 10 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : fb.label}
        {@const line2 = words.length > 1 && fb.label.length > 10 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''}

        <g
          class="field-block select-none cursor-move group"
          transform="translate({fb.x}, {fb.y})"
          onmousedown={(e) => handleFieldBlockMouseDown(fb.id, e)}
          onclick={(e) => {
            e.stopPropagation();
            panelStore.select('field_block', fb.id);
          }}
          role="button"
          tabindex="0"
        >
          <!-- Outer Shadow & Background (Compact Solid Square Form Factor) -->
          <rect
            x="0"
            y="0"
            width={w}
            height={h}
            rx="6"
            fill="#ffffff"
            stroke={isSelected ? '#2563eb' : '#94a3b8'}
            stroke-width={isSelected ? 3 : 1.5}
            class="filter drop-shadow-md hover:stroke-amber-400 transition-colors"
          />

          <!-- Category Top Accent Strip -->
          <rect
            x="0"
            y="0"
            width={w}
            height="4"
            rx="2"
            fill="#f59e0b"
          />

          <!-- Badge pill -->
          <rect
            x={w / 2 - 25}
            y={isTop ? 27 : 7}
            width="50"
            height="9"
            rx="2"
            fill="#fef3c7"
            stroke="#f59e0b"
            stroke-width="0.6"
          />
          <text
            x={w / 2}
            y={isTop ? 33.5 : 13.5}
            font-size="5"
            font-weight="900"
            fill="#b45309"
            text-anchor="middle"
            font-family="monospace"
          >
            FIELD I/O
          </text>

          <!-- Block Label ("From House", "To Airconditioner") -->
          {#if line2}
            <text
              x={w / 2}
              y={isTop ? 46 : 28}
              font-size="7.5"
              font-weight="900"
              fill="#0f172a"
              text-anchor="middle"
              font-family="system-ui, sans-serif"
            >
              {line1}
            </text>
            <text
              x={w / 2}
              y={isTop ? 56 : 38}
              font-size="7.5"
              font-weight="900"
              fill="#0f172a"
              text-anchor="middle"
              font-family="system-ui, sans-serif"
            >
              {line2}
            </text>
          {:else}
            <text
              x={w / 2}
              y={isTop ? 50 : 33}
              font-size="8.5"
              font-weight="900"
              fill="#0f172a"
              text-anchor="middle"
              font-family="system-ui, sans-serif"
            >
              {line1}
            </text>
          {/if}

          <!-- Circuit Description -->
          <text
            x={w / 2}
            y={isTop ? 66 : 48}
            font-size="5.5"
            font-weight="bold"
            fill="#64748b"
            text-anchor="middle"
            font-family="system-ui, sans-serif"
          >
            {fb.description || '230V 2-Wire'}
          </text>

          <!-- TERMINAL 1 (Line 1 / Hot) -->
          <g
            class="terminal cursor-pointer group/term1"
            transform="translate(24, {termY})"
            onmousedown={(e) => handleFieldBlockTerminalMouseDown(fb.id, '1', e)}
            onclick={(e) => handleFieldBlockTerminalMouseDown(fb.id, '1', e)}
            role="button"
            tabindex="0"
          >
            <circle r="14" fill="transparent" />
            <title>Terminal 1 (L / Line 1)</title>
            <circle
              r="6"
              fill="#e2e8f0"
              stroke="#64748b"
              stroke-width="1.5"
              class="transition-all group-hover/term1:stroke-blue-500 group-hover/term1:scale-125"
            />
            <line x1="-3" y1="-2" x2="3" y2="2" stroke="#475569" stroke-width="1.5" />
            <circle r="4" fill="#3b82f6" class="opacity-0 group-hover/term1:opacity-100 transition-opacity" />
            <text
              x="0"
              y={isTop ? -9 : 14}
              text-anchor="middle"
              font-size="5.5"
              font-weight="bold"
              fill="#2563eb"
            >
              1 (L)
            </text>
          </g>

          <!-- TERMINAL 2 (Neutral / Line 2) -->
          <g
            class="terminal cursor-pointer group/term2"
            transform="translate({w - 24}, {termY})"
            onmousedown={(e) => handleFieldBlockTerminalMouseDown(fb.id, '2', e)}
            onclick={(e) => handleFieldBlockTerminalMouseDown(fb.id, '2', e)}
            role="button"
            tabindex="0"
          >
            <circle r="14" fill="transparent" />
            <title>Terminal 2 (N / Line 2)</title>
            <circle
              r="6"
              fill="#e2e8f0"
              stroke="#64748b"
              stroke-width="1.5"
              class="transition-all group-hover/term2:stroke-blue-500 group-hover/term2:scale-125"
            />
            <line x1="-3" y1="-2" x2="3" y2="2" stroke="#475569" stroke-width="1.5" />
            <circle r="4" fill="#3b82f6" class="opacity-0 group-hover/term2:opacity-100 transition-opacity" />
            <text
              x="0"
              y={isTop ? -9 : 14}
              text-anchor="middle"
              font-size="5.5"
              font-weight="bold"
              fill="#dc2626"
            >
              2 (N)
            </text>
          </g>
        </g>
      {/each}

      <!-- ROUTED WIRES -->
      {#each panelStore.wires as wire}
        {@const src = getTerminalCoords(wire.sourceDeviceId, wire.sourceTerminalId)}
        {@const tgt = getTerminalCoords(wire.targetDeviceId, wire.targetTerminalId)}
        {#if src && tgt}
          {@const gauge = getGaugeDef(wire.gaugeMetric)}
          {@const isSelected = panelStore.selectedType === 'wire' && panelStore.selectedId === wire.id}
          {@const pathD = generateWirePath(src, tgt, wire.waypoints || [], wire.routingMode || 'orthogonal')}

          <g
            class="wire-group cursor-pointer group"
            onclick={(e) => {
              e.stopPropagation();
              panelStore.select('wire', wire.id);
            }}
            ondblclick={(e) => handleWireDoubleClick(wire.id, e)}
            role="button"
            tabindex="0"
          >
            <!-- Wire Glow / Selection Halo -->
            <path
              d={pathD}
              fill="none"
              stroke={isSelected ? '#38bdf8' : 'transparent'}
              stroke-width={gauge.renderWidth + 7}
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:stroke-blue-400/50 transition-all"
            />

            <!-- Wire Outer Core -->
            <path
              d={pathD}
              fill="none"
              stroke={wire.color}
              stroke-width={gauge.renderWidth}
              stroke-linecap="round"
              stroke-linejoin="round"
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
                stroke-linejoin="round"
              />
            {/if}

            <!-- Source & Target Terminal Ring Caps -->
            <circle cx={src.x} cy={src.y} r="3.5" fill="#ffffff" stroke={wire.color} stroke-width="1.5" />
            <circle cx={tgt.x} cy={tgt.y} r="3.5" fill="#ffffff" stroke={wire.color} stroke-width="1.5" />

            <!-- DRAGGABLE WAYPOINT NODES (When wire is selected) -->
            {#if isSelected}
              {#each wire.waypoints || [] as wp, wpIdx}
                <g
                  class="waypoint-handle cursor-move"
                  transform="translate({wp.x}, {wp.y})"
                  onmousedown={(e) => handleWaypointMouseDown(wire.id, wpIdx, e)}
                  oncontextmenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    panelStore.removeWireWaypoint(wire.id, wpIdx);
                  }}
                  role="button"
                  tabindex="0"
                >
                  <!-- Invisible generous hit area -->
                  <circle r="14" fill="transparent" />
                  <!-- Outer white circle with blue ring -->
                  <circle
                    r="6.5"
                    fill="#ffffff"
                    stroke="#2563eb"
                    stroke-width="2.5"
                    class="hover:scale-125 filter drop-shadow transition-transform"
                  />
                  <circle r="2.5" fill="#3b82f6" />
                </g>
              {/each}
            {/if}
          </g>
        {/if}
      {/each}

      <!-- RUBBERBAND WIRE DRAFT (Active mouse connection - Pointer Events None) -->
      {#if panelStore.wireDraft}
        {@const srcCoords = getTerminalCoords(panelStore.wireDraft.sourceDeviceId, panelStore.wireDraft.sourceTerminalId)}
        {#if srcCoords}
          {@const draftGauge = getGaugeDef(panelStore.activeWireGauge)}
          {@const draftColor = getWireColor(panelStore.activeWireRole, panelStore.config.wireStandard)}
          {@const draftPath = generateWirePath(
            srcCoords,
            { x: panelStore.wireDraft.currentX, y: panelStore.wireDraft.currentY },
            [],
            panelStore.activeWireRouting
          )}
          <g class="pointer-events-none" pointer-events="none">
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
          </g>
        {/if}
      {/if}

      <!-- DROP TARGET HIGHLIGHT -->
      {#if dragHoverRail !== null && dragHoverSlot !== null}
        {@const hoverX = PADDING_X + dragHoverSlot * MODULE_WIDTH_PX}
        {@const hoverY = PADDING_Y + dragHoverRail * railSpacing}
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
