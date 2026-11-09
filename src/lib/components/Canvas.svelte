<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import { getDeviceDef } from '#lib/catalog';
  import { getGaugeDef, getWireColor, isDarkWireColor } from '#lib/wireStandards';
  import type { CombBusbar, FreeEquipment, PanelConfig, PlacedDevice, WirePoint, WireRole } from '#lib/types';
  import DeviceItem from './DeviceItem.svelte';

  const MODULE_WIDTH_PX = 44;
  const DEVICE_HEIGHT_PX = 160;
  const PADDING_X = 60;
  const PADDING_Y = 120;

  let svgElement: SVGSVGElement | null = $state(null);
  let cachedSvgRect: DOMRect | null = null;
  let isPanning = $state(false);
  let panStartX = $state(0);
  let panStartY = $state(0);

  // Dragging device state
  let draggingDeviceId = $state<string | null>(null);
  let dragHoverPanelId = $state<string | null>(null);
  let dragHoverRail = $state<number | null>(null);
  let dragHoverSlot = $state<number | null>(null);

  // Dragging waypoint state
  let draggingWaypoint = $state<{ wireId: string; nodeIndex: number } | null>(null);

  // Dragging equipment state (Solar, Battery, MCCB, Inverters, Field Block)
  let draggingEquipmentId = $state<string | null>(null);
  let equipmentDragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging panel state
  let draggingPanelId = $state<string | null>(null);
  let panelDragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  // O(1) Lookup Maps & Grouped Collections for Fast Rendering
  const panelMap = $derived(new Map<string, PanelConfig>(panelStore.panels.map((p) => [p.id, p])));
  const deviceMap = $derived(new Map<string, PlacedDevice>(panelStore.devices.map((d) => [d.id, d])));
  const equipmentMap = $derived(new Map<string, FreeEquipment>(panelStore.equipment.map((e) => [e.id, e])));

  const devicesByPanel = $derived.by(() => {
    const map = new Map<string, PlacedDevice[]>();
    const defaultPanelId = panelStore.panels[0]?.id || 'panel-1';
    for (const p of panelStore.panels) {
      map.set(p.id, []);
    }
    for (const d of panelStore.devices) {
      const pid = d.panelId || defaultPanelId;
      let list = map.get(pid);
      if (!list) {
        list = [];
        map.set(pid, list);
      }
      list.push(d);
    }
    return map;
  });

  const busbarsByPanel = $derived.by(() => {
    const map = new Map<string, CombBusbar[]>();
    const defaultPanelId = panelStore.panels[0]?.id || 'panel-1';
    for (const p of panelStore.panels) {
      map.set(p.id, []);
    }
    for (const b of panelStore.busbars) {
      const pid = b.panelId || defaultPanelId;
      let list = map.get(pid);
      if (!list) {
        list = [];
        map.set(pid, list);
      }
      list.push(b);
    }
    return map;
  });

  function getSvgRect(forceRefresh = false): DOMRect | null {
    if (!svgElement) return null;
    if (!cachedSvgRect || forceRefresh) {
      cachedSvgRect = svgElement.getBoundingClientRect();
    }
    return cachedSvgRect;
  }

  // Calculate terminal absolute canvas coordinates in O(1)
  function getTerminalCoords(
    deviceId: string,
    terminalId: string
  ): { x: number; y: number; position: 'top' | 'bottom' } | null {
    // PE Busbars
    if (deviceId.startsWith('PE_BAR')) {
      const panelId = deviceId.includes(':')
        ? deviceId.split(':')[0].replace('PE_BAR_', '')
        : deviceId.replace('PE_BAR_', '');
      const panel = panelMap.get(panelId) || panelStore.panels[0];
      const railWidthPx = panel.slotsPerRow * MODULE_WIDTH_PX;
      const index = parseInt(terminalId.replace('G_', '')) || 1;
      const x = panel.x + PADDING_X + (index - 0.5) * (railWidthPx / panel.groundBarSlots);
      const y = panel.y + PADDING_Y - 40;
      return { x, y, position: 'top' };
    }

    // Neutral Busbars
    if (deviceId.startsWith('N_BAR')) {
      const panelId = deviceId.includes(':')
        ? deviceId.split(':')[0].replace('N_BAR_', '')
        : deviceId.replace('N_BAR_', '');
      const panel = panelMap.get(panelId) || panelStore.panels[0];
      const railWidthPx = panel.slotsPerRow * MODULE_WIDTH_PX;
      const railSpacing = panel.railSpacing || 230;
      const panelTotalHeight = panel.rows * railSpacing + PADDING_Y * 2;
      const index = parseInt(terminalId.replace('N_', '')) || 1;
      const x = panel.x + PADDING_X + (index - 0.5) * (railWidthPx / panel.neutralBarSlots);
      const y = panel.y + panelTotalHeight - PADDING_Y + 44;
      return { x, y, position: 'bottom' };
    }

    // Free Equipment (Solar Panel, Battery, MCCB, Hybrid & Offgrid Inverters, Field Block)
    const eq = equipmentMap.get(deviceId);
    if (eq) {
      return getEquipmentTerminalCoords(eq, terminalId);
    }

    // DIN-rail modular device
    const device = deviceMap.get(deviceId);
    if (!device) return null;
    const def = getDeviceDef(device.typeId);
    if (!def) return null;

    const term = def.terminals.find((t) => t.id === terminalId);
    if (!term) return null;

    const panel = (device.panelId ? panelMap.get(device.panelId) : undefined) || panelStore.activePanel;
    const railSpacing = panel.railSpacing || 230;
    const railY = panel.y + PADDING_Y + device.railIndex * railSpacing;
    const devX = panel.x + PADDING_X + device.slotIndex * MODULE_WIDTH_PX;
    const termX = devX + term.slotOffset * MODULE_WIDTH_PX;
    const termY =
      railY +
      (term.yOffset !== undefined
        ? term.yOffset
        : term.position === 'top'
          ? 12
          : DEVICE_HEIGHT_PX - 14);

    return { x: termX, y: termY, position: term.position };
  }

  // Calculate terminal coordinates for free equipment
  function getEquipmentTerminalCoords(
    eq: FreeEquipment,
    terminalId: string
  ): { x: number; y: number; position: 'top' | 'bottom' } | null {
    const w = eq.width || 100;
    const h = eq.height || 100;
    const isTop = (eq.terminalPosition || 'top') !== 'bottom';

    switch (eq.type) {
      case 'solar_panel': {
        const termY = isTop ? eq.y + 16 : eq.y + h - 16;
        const pos: 'top' | 'bottom' = isTop ? 'top' : 'bottom';
        if (terminalId === 'PV+' || terminalId === '1' || terminalId === 'DC+') {
          return { x: eq.x + 30, y: termY, position: pos };
        }
        return { x: eq.x + w - 30, y: termY, position: pos };
      }

      case 'battery': {
        const termY = isTop ? eq.y + 16 : eq.y + h - 16;
        const pos: 'top' | 'bottom' = isTop ? 'top' : 'bottom';
        if (terminalId === 'BAT+' || terminalId === 'B+' || terminalId === '1') {
          return { x: eq.x + 32, y: termY, position: pos };
        }
        return { x: eq.x + w - 32, y: termY, position: pos };
      }

      case 'mccb': {
        if (terminalId.includes('IN') || terminalId === '1' || terminalId === '3') {
          const xOffset = terminalId === 'L1_IN' || terminalId === '1' ? 28 : w - 28;
          return { x: eq.x + xOffset, y: eq.y + 14, position: 'top' };
        } else {
          const xOffset = terminalId === 'L1_OUT' || terminalId === '2' ? 28 : w - 28;
          return { x: eq.x + xOffset, y: eq.y + h - 14, position: 'bottom' };
        }
      }

      case 'hybrid_inverter': {
        // Top row terminals: PV1+, PV1-, BAT+, BAT-
        if (terminalId === 'PV1+' || terminalId === 'PV+' || terminalId === 'DC+') {
          return { x: eq.x + 28, y: eq.y + 16, position: 'top' };
        }
        if (terminalId === 'PV1-' || terminalId === 'PV-' || terminalId === 'DC-') {
          return { x: eq.x + 56, y: eq.y + 16, position: 'top' };
        }
        if (terminalId === 'BAT+' || terminalId === 'B+') {
          return { x: eq.x + w - 56, y: eq.y + 16, position: 'top' };
        }
        if (terminalId === 'BAT-' || terminalId === 'B-') {
          return { x: eq.x + w - 26, y: eq.y + 16, position: 'top' };
        }

        // Bottom row terminals: AC_IN (L, N, PE) & AC_OUT (L, N, PE)
        if (terminalId === 'AC_IN_L') return { x: eq.x + 26, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_IN_N') return { x: eq.x + 50, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_IN_PE') return { x: eq.x + 74, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_OUT_L') return { x: eq.x + w - 74, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_OUT_N') return { x: eq.x + w - 50, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_OUT_PE') return { x: eq.x + w - 26, y: eq.y + h - 16, position: 'bottom' };

        return { x: eq.x + w / 2, y: eq.y + h - 16, position: 'bottom' };
      }

      case 'offgrid_inverter': {
        if (terminalId === 'PV+' || terminalId === 'DC+') return { x: eq.x + 32, y: eq.y + 16, position: 'top' };
        if (terminalId === 'PV-' || terminalId === 'DC-') return { x: eq.x + 60, y: eq.y + 16, position: 'top' };
        if (terminalId === 'BAT+' || terminalId === 'B+') return { x: eq.x + w - 60, y: eq.y + 16, position: 'top' };
        if (terminalId === 'BAT-' || terminalId === 'B-') return { x: eq.x + w - 32, y: eq.y + 16, position: 'top' };

        if (terminalId === 'AC_OUT_L') return { x: eq.x + 36, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_OUT_N') return { x: eq.x + 72, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_OUT_PE') return { x: eq.x + 108, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_IN_L') return { x: eq.x + w - 50, y: eq.y + h - 16, position: 'bottom' };
        if (terminalId === 'AC_IN_N') return { x: eq.x + w - 24, y: eq.y + h - 16, position: 'bottom' };

        return { x: eq.x + w / 2, y: eq.y + h - 16, position: 'bottom' };
      }

      case 'field_block':
      default: {
        const termY = isTop ? eq.y + 14 : eq.y + h - 14;
        const pos: 'top' | 'bottom' = isTop ? 'top' : 'bottom';
        const termX = terminalId === '1' || terminalId === 'L' ? eq.x + 24 : eq.x + w - 24;
        return { x: termX, y: termY, position: pos };
      }
    }
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
    let path = `M ${x1} ${y1}`;
    const allPoints = [{ x: x1, y: y1 }, ...waypoints, { x: x2, y: y2 }];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const cur = allPoints[i];
      const nxt = allPoints[i + 1];

      if (cur.x === nxt.x || cur.y === nxt.y) {
        path += ` L ${nxt.x} ${nxt.y}`;
      } else {
        if (i === 0) {
          path += ` L ${cur.x} ${nxt.y} L ${nxt.x} ${nxt.y}`;
        } else if (i === allPoints.length - 2) {
          path += ` L ${nxt.x} ${cur.y} L ${nxt.x} ${nxt.y}`;
        } else {
          path += ` L ${nxt.x} ${cur.y} L ${nxt.x} ${nxt.y}`;
        }
      }
    }

    return path;
  }

  // Pan / Zoom events
  function handleMouseDown(e: MouseEvent) {
    getSvgRect(true);
    const target = e.target as Element;
    if (
      e.button === 1 ||
      (e.button === 0 && e.altKey) ||
      (panelStore.activeTool === 'select' && (target.tagName === 'svg' || target.id === 'canvas-grid-bg'))
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

    // Fast early-return when idle (prevents forced layout reads on every mouse movement)
    if (
      !draggingWaypoint &&
      !draggingPanelId &&
      !draggingEquipmentId &&
      !panelStore.wireDraft &&
      !draggingDeviceId &&
      !panelStore.pendingPlaceTypeId
    ) {
      return;
    }

    const rect = getSvgRect();
    if (!rect) return;
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

    // Dragging panel
    if (draggingPanelId) {
      panelStore.movePanel(
        draggingPanelId,
        rawX - panelDragOffset.x,
        rawY - panelDragOffset.y
      );
      return;
    }

    // Dragging free-place equipment
    if (draggingEquipmentId) {
      const eq = equipmentMap.get(draggingEquipmentId);
      if (eq) {
        const nextX = Math.round((rawX - equipmentDragOffset.x) / 5) * 5;
        const nextY = Math.round((rawY - equipmentDragOffset.y) / 5) * 5;
        if (eq.x !== nextX) eq.x = nextX;
        if (eq.y !== nextY) eq.y = nextY;
      }
      return;
    }

    // Update wire drafting rubber-band
    if (panelStore.wireDraft) {
      panelStore.updateWireDraftPoint(rawX, rawY);
    }

    // Update drag hover slot across all panels
    if (draggingDeviceId || panelStore.pendingPlaceTypeId) {
      let foundPanelId: string | null = null;
      let foundRail: number | null = null;
      let foundSlot: number | null = null;

      for (const panel of panelStore.panels) {
        const pRailSpacing = panel.railSpacing || 230;
        const relX = rawX - panel.x - PADDING_X;
        const relY = rawY - panel.y - PADDING_Y;

        const railIdx = Math.floor(relY / pRailSpacing);
        const slotIdx = Math.floor(relX / MODULE_WIDTH_PX);

        if (railIdx >= 0 && railIdx < panel.rows && slotIdx >= 0 && slotIdx < panel.slotsPerRow) {
          foundPanelId = panel.id;
          foundRail = railIdx;
          foundSlot = slotIdx;
          break;
        }
      }

      dragHoverPanelId = foundPanelId;
      dragHoverRail = foundRail;
      dragHoverSlot = foundSlot;
    }
  }

  function handleMouseUp() {
    isPanning = false;
    let shouldPersist = false;

    if (draggingWaypoint) {
      draggingWaypoint = null;
      shouldPersist = true;
    }

    if (draggingPanelId) {
      draggingPanelId = null;
      shouldPersist = true;
    }

    // If placing from catalog
    if (panelStore.pendingPlaceTypeId && dragHoverRail !== null && dragHoverSlot !== null && dragHoverPanelId) {
      panelStore.placeDevice(panelStore.pendingPlaceTypeId, dragHoverRail, dragHoverSlot, dragHoverPanelId);
      panelStore.pendingPlaceTypeId = null;
    }

    // If moving existing device
    if (draggingDeviceId && dragHoverRail !== null && dragHoverSlot !== null && dragHoverPanelId) {
      panelStore.moveDevice(draggingDeviceId, dragHoverRail, dragHoverSlot, dragHoverPanelId);
      draggingDeviceId = null;
    }

    if (draggingEquipmentId) {
      draggingEquipmentId = null;
      shouldPersist = true;
    }

    if (shouldPersist) {
      panelStore.saveToLocalStorage();
    }

    dragHoverPanelId = null;
    dragHoverRail = null;
    dragHoverSlot = null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(panelStore.zoom * zoomFactor, 0.4), 2.5);
    panelStore.zoom = Number(newZoom.toFixed(2));
  }

  // Panel drag start
  function handlePanelHeaderMouseDown(panelId: string, e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    panelStore.select('panel', panelId);
    const p = panelMap.get(panelId);
    const rect = getSvgRect(true);
    if (!p || !rect) return;

    const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
    const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;

    draggingPanelId = panelId;
    panelDragOffset = { x: rawX - p.x, y: rawY - p.y };
  }

  // Equipment drag start
  function handleEquipmentMouseDown(id: string, e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    panelStore.select('equipment', id);
    const eq = equipmentMap.get(id);
    const rect = getSvgRect(true);
    if (!eq || !rect) return;
    const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
    const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;
    draggingEquipmentId = id;
    equipmentDragOffset = { x: rawX - eq.x, y: rawY - eq.y };
  }

  let lastDraftStartTime = $state(0);

  // Terminal mousedown handler (starts or completes wire draft)
  function handleTerminalMouseDown(
    deviceId: string,
    terminalId: string,
    e: MouseEvent,
    suggestedRole?: WireRole
  ) {
    if (e.button !== 0) return;
    e.stopPropagation();
    getSvgRect(true);
    const coords = getTerminalCoords(deviceId, terminalId);
    if (!coords) return;

    if (!panelStore.wireDraft) {
      if (suggestedRole) {
        panelStore.activeWireRole = suggestedRole;
      }
      lastDraftStartTime = Date.now();
      panelStore.startWireDraft(deviceId, terminalId, coords.x, coords.y);
    } else {
      panelStore.completeWireDraft(deviceId, terminalId);
    }
  }

  // Terminal mouseup handler (supports press-drag-release wiring between two terminals)
  function handleTerminalMouseUp(deviceId: string, terminalId: string, e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (
      panelStore.wireDraft &&
      (panelStore.wireDraft.sourceDeviceId !== deviceId ||
        panelStore.wireDraft.sourceTerminalId !== terminalId)
    ) {
      panelStore.completeWireDraft(deviceId, terminalId);
    }
  }

  // Equipment terminal click
  function handleEquipmentTerminalMouseDown(
    eqId: string,
    terminalId: string,
    suggestedRole: WireRole = 'line1',
    e: MouseEvent
  ) {
    handleTerminalMouseDown(eqId, terminalId, e, suggestedRole);
  }

  // Handle double clicking wire to add waypoint node
  function handleWireDoubleClick(wireId: string, e: MouseEvent) {
    e.stopPropagation();
    const rect = getSvgRect(true);
    if (!rect) return;
    const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
    const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;
    panelStore.addWireWaypoint(wireId, { x: rawX, y: rawY });
  }

  // Dragging intermediate waypoint node
  function handleWaypointMouseDown(wireId: string, nodeIndex: number, e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    getSvgRect(true);
    draggingWaypoint = { wireId, nodeIndex };
  }

  function handleCanvasClick(e: MouseEvent) {
    if (panelStore.wireDraft) {
      if (Date.now() - lastDraftStartTime < 250) return;
      panelStore.cancelWireDraft();
    } else {
      panelStore.clearSelection();
    }
  }
</script>

<svelte:window onresize={() => (cachedSvgRect = null)} />

<div
  class="relative w-full h-full overflow-hidden bg-slate-950 cursor-default select-none"
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
    <!-- Viewport-Sized Background Grid Pattern (Avoids 8000x8000 nested pattern rasterization) -->
    <defs>
      <pattern
        id="grid"
        width="100"
        height="100"
        patternUnits="userSpaceOnUse"
        patternTransform="translate({panelStore.pan.x}, {panelStore.pan.y}) scale({panelStore.zoom})"
      >
        <path
          d="M 20 0 V 100 M 40 0 V 100 M 60 0 V 100 M 80 0 V 100 M 0 20 H 100 M 0 40 H 100 M 0 60 H 100 M 0 80 H 100"
          fill="none"
          stroke="#1e293b"
          stroke-width="0.8"
        />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" stroke-width="1.2" />
      </pattern>
    </defs>

    <!-- Fixed Viewport Grid Background -->
    <rect
      id="canvas-grid-bg"
      x="0"
      y="0"
      width="100%"
      height="100%"
      fill="url(#grid)"
      opacity="0.6"
    />

    <!-- Canvas Transform Layer -->
    <g transform="translate({panelStore.pan.x}, {panelStore.pan.y}) scale({panelStore.zoom})">
      <!-- MULTIPLE BREAKER PANELS -->
      {#each panelStore.panels as panel (panel.id)}
        {@const pRailSpacing = panel.railSpacing || 230}
        {@const pRailWidthPx = panel.slotsPerRow * MODULE_WIDTH_PX}
        {@const pTotalWidth = pRailWidthPx + PADDING_X * 2}
        {@const pTotalHeight = panel.rows * pRailSpacing + PADDING_Y * 2}
        {@const isPanelSelected = panelStore.selectedType === 'panel' && panelStore.selectedId === panel.id}
        {@const isActivePanel = panelStore.activePanelId === panel.id}

        <g class="panel-enclosure" transform="translate({panel.x}, {panel.y})">
          <!-- Lightweight Native Vector Shadow for Enclosure -->
          <rect
            x={PADDING_X - 24}
            y={PADDING_Y - 87}
            width={pRailWidthPx + 60}
            height={pTotalHeight - PADDING_Y * 2 + 165}
            rx="14"
            fill="#020617"
            opacity="0.55"
            pointer-events="none"
          />
          <!-- Enclosure Box Body -->
          <rect
            id="enclosure-bg-{panel.id}"
            x={PADDING_X - 30}
            y={PADDING_Y - 95}
            width={pRailWidthPx + 60}
            height={pTotalHeight - PADDING_Y * 2 + 165}
            rx="14"
            fill="#0f172a"
            stroke={isPanelSelected ? '#38bdf8' : isActivePanel ? '#3b82f6' : '#475569'}
            stroke-width={isPanelSelected ? 3.5 : isActivePanel ? 2.5 : 2}
            class="cursor-pointer"
            onclick={(e) => {
              e.stopPropagation();
              panelStore.select('panel', panel.id);
            }}
          />

          <!-- Panel Drag & Select Header Bar -->
          <rect
            x={PADDING_X - 25}
            y={PADDING_Y - 90}
            width={pRailWidthPx + 50}
            height="32"
            rx="6"
            fill={isActivePanel ? '#1e293b' : '#0f172a'}
            stroke={isActivePanel ? '#334155' : 'transparent'}
            stroke-width="1"
            class="cursor-move hover:fill-slate-800"
            onmousedown={(e) => handlePanelHeaderMouseDown(panel.id, e)}
          />

          <!-- Enclosure Title / Header Label -->
          <text
            x={PADDING_X}
            y={PADDING_Y - 69}
            font-size="12"
            font-weight="bold"
            fill={isActivePanel ? '#38bdf8' : '#94a3b8'}
            class="font-mono tracking-wider uppercase select-none cursor-move"
            onmousedown={(e) => handlePanelHeaderMouseDown(panel.id, e)}
          >
            ⚡ {panel.name} ({panel.slotsPerRow}M × {panel.rows} Rows)
          </text>

          <!-- Active Panel Badge -->
          <rect
            x={PADDING_X + pRailWidthPx - 55}
            y={PADDING_Y - 82}
            width="65"
            height="16"
            rx="4"
            fill={isActivePanel ? '#2563eb' : '#334155'}
          />
          <text
            x={PADDING_X + pRailWidthPx - 22}
            y={PADDING_Y - 70}
            text-anchor="middle"
            font-size="8"
            font-weight="bold"
            fill="#ffffff"
            class="font-mono"
          >
            {isActivePanel ? 'ACTIVE' : 'SELECT'}
          </text>

          <!-- TOP GROUND (PE) BRASS BUSBAR STRIP -->
          {#if panel.hasGroundBar}
            <g class="ground-bar" transform="translate({PADDING_X}, {PADDING_Y - 48})">
              <rect
                x="0"
                y="0"
                width={pRailWidthPx}
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
              {#each Array(panel.groundBarSlots) as _, idx}
                {@const holeX = (idx + 0.5) * (pRailWidthPx / panel.groundBarSlots)}
                <g
                  class="terminal-pe cursor-pointer group"
                  transform="translate({holeX}, 8)"
                  onmousedown={(e) => handleTerminalMouseDown(`PE_BAR_${panel.id}`, `G_${idx + 1}`, e, 'earth')}
                  onmouseup={(e) => handleTerminalMouseUp(`PE_BAR_${panel.id}`, `G_${idx + 1}`, e)}
                  onclick={(e) => e.stopPropagation()}
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
          {#if panel.hasNeutralBar}
            <g class="neutral-bar" transform="translate({PADDING_X}, {pTotalHeight - PADDING_Y + 36})">
              <rect
                x="0"
                y="0"
                width={pRailWidthPx}
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
              {#each Array(panel.neutralBarSlots) as _, idx}
                {@const holeX = (idx + 0.5) * (pRailWidthPx / panel.neutralBarSlots)}
                <g
                  class="terminal-n cursor-pointer group"
                  transform="translate({holeX}, 8)"
                  onmousedown={(e) => handleTerminalMouseDown(`N_BAR_${panel.id}`, `N_${idx + 1}`, e, 'neutral')}
                  onmouseup={(e) => handleTerminalMouseUp(`N_BAR_${panel.id}`, `N_${idx + 1}`, e)}
                  onclick={(e) => e.stopPropagation()}
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
          {#if panel.rows > 1}
            {#each Array(panel.rows - 1) as _, r}
              {@const gutterTopY = PADDING_Y + r * pRailSpacing + DEVICE_HEIGHT_PX}
              {@const gutterBottomY = PADDING_Y + (r + 1) * pRailSpacing}
              {@const gutterHeight = gutterBottomY - gutterTopY}
              {@const gutterMidY = (gutterTopY + gutterBottomY) / 2}

              <g class="gutter-guide select-none">
                <line
                  x1={PADDING_X - 26}
                  y1={gutterTopY + 2}
                  x2={PADDING_X - 26}
                  y2={gutterBottomY - 2}
                  stroke="#64748b"
                  stroke-width="1.2"
                  stroke-dasharray="3,3"
                />
                <line
                  x1={PADDING_X - 32}
                  y1={gutterTopY + 2}
                  x2={PADDING_X - 20}
                  y2={gutterTopY + 2}
                  stroke="#64748b"
                  stroke-width="1.5"
                />
                <line
                  x1={PADDING_X - 32}
                  y1={gutterBottomY - 2}
                  x2={PADDING_X - 20}
                  y2={gutterBottomY - 2}
                  stroke="#64748b"
                  stroke-width="1.5"
                />
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
          {#each Array(panel.rows) as _, r}
            {@const railY = PADDING_Y + r * pRailSpacing}
            <g class="din-rail-row">
              <rect
                x={PADDING_X - 10}
                y={railY + DEVICE_HEIGHT_PX * 0.35}
                width={pRailWidthPx + 20}
                height="35"
                rx="2"
                fill="#334155"
                stroke="#64748b"
                stroke-width="1.5"
              />
              <line
                x1={PADDING_X - 10}
                y1={railY + DEVICE_HEIGHT_PX * 0.35 + 8}
                x2={PADDING_X + pRailWidthPx + 10}
                y2={railY + DEVICE_HEIGHT_PX * 0.35 + 8}
                stroke="#1e293b"
                stroke-width="2"
              />
              <line
                x1={PADDING_X - 10}
                y1={railY + DEVICE_HEIGHT_PX * 0.35 + 27}
                x2={PADDING_X + pRailWidthPx + 10}
                y2={railY + DEVICE_HEIGHT_PX * 0.35 + 27}
                stroke="#1e293b"
                stroke-width="2"
              />

              {#each Array(panel.slotsPerRow) as _, s}
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
                x1={PADDING_X + pRailWidthPx}
                y1={railY - 6}
                x2={PADDING_X + pRailWidthPx}
                y2={railY + DEVICE_HEIGHT_PX + 6}
                stroke="#334155"
                stroke-dasharray="2,4"
              />
            </g>
          {/each}

          <!-- PLACED COMB BUSBARS FOR THIS PANEL -->
          {#each busbarsByPanel.get(panel.id) || [] as busbar (busbar.id)}
            {@const railY = PADDING_Y + busbar.railIndex * pRailSpacing}
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

          <!-- PLACED DEVICES FOR THIS PANEL -->
          {#each devicesByPanel.get(panel.id) || [] as device (device.id)}
            {@const devX = PADDING_X + device.slotIndex * MODULE_WIDTH_PX}
            {@const devY = PADDING_Y + device.railIndex * pRailSpacing}
            <DeviceItem
              {device}
              x={devX}
              y={devY}
              moduleWidthPx={MODULE_WIDTH_PX}
              heightPx={DEVICE_HEIGHT_PX}
              onTerminalMouseDown={handleTerminalMouseDown}
              onTerminalMouseUp={handleTerminalMouseUp}
            />
          {/each}

          <!-- DROP TARGET HIGHLIGHT ON THIS PANEL -->
          {#if dragHoverPanelId === panel.id && dragHoverRail !== null && dragHoverSlot !== null}
            {@const hoverX = PADDING_X + dragHoverSlot * MODULE_WIDTH_PX}
            {@const hoverY = PADDING_Y + dragHoverRail * pRailSpacing}
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
      {/each}

      <!-- FREE-PLACE EQUIPMENT (SOLAR PANELS, BATTERY, MCCB, INVERTERS, FIELD BLOCKS) -->
      {#each panelStore.equipment as eq (eq.id)}
        {@const isSelected = (panelStore.selectedType === 'equipment' || panelStore.selectedType === 'field_block') && panelStore.selectedId === eq.id}
        {@const w = eq.width || 100}
        {@const h = eq.height || 100}

        <g
          class="free-equipment select-none cursor-move group"
          transform="translate({eq.x}, {eq.y})"
          onmousedown={(e) => handleEquipmentMouseDown(eq.id, e)}
          onclick={(e) => {
            e.stopPropagation();
            panelStore.select('equipment', eq.id);
          }}
          role="button"
          tabindex="0"
        >
          <!-- Lightweight Native Vector Shadow for Equipment -->
          <rect
            x="3"
            y="5"
            width={w}
            height={h}
            rx="6"
            fill="#020617"
            opacity="0.45"
            pointer-events="none"
          />

          <!-- 1. SOLAR PANEL (Photovoltaic Monocrystalline Module) -->
          {#if eq.type === 'solar_panel'}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              rx="6"
              fill="#091428"
              stroke={isSelected ? '#38bdf8' : '#94a3b8'}
              stroke-width={isSelected ? 3 : 1.5}
              class="hover:stroke-amber-400"
            />
            <!-- Aluminum Anodized Border Frame -->
            <rect x="2" y="2" width={w - 4} height={h - 4} rx="4" fill="none" stroke="#cbd5e1" stroke-width="2" />
            <!-- Solar PV Cells Grid -->
            <g opacity="0.4" stroke="#60a5fa" stroke-width="0.8">
              {#each Array(4) as _, r}
                <line x1="6" y1={28 + r * 26} x2={w - 6} y2={28 + r * 26} />
              {/each}
              {#each Array(3) as _, c}
                <line x1={20 + c * 26} y1="28" x2={20 + c * 26} y2={h - 24} />
              {/each}
            </g>
            <!-- Badge pill -->
            <rect x={w / 2 - 38} y="8" width="76" height="13" rx="3" fill="#fef3c7" stroke="#f59e0b" stroke-width="0.8" />
            <text x={w / 2} y="17.5" font-size="7" font-weight="900" fill="#b45309" text-anchor="middle" font-family="monospace">
              ☀️ PV MODULE
            </text>
            <!-- Rated Power Display -->
            <text x={w / 2} y={h / 2 - 2} font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">
              {eq.powerWatts || 550}W
            </text>
            <!-- Specs Subtitle -->
            <text x={w / 2} y={h / 2 + 13} font-size="7" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="monospace">
              {eq.voltage || 41.5}V • {eq.current || 13.25}A
            </text>
            <text x={w / 2} y={h - 18} font-size="7.5" font-weight="bold" fill="#f8fafc" text-anchor="middle">
              {eq.label}
            </text>

            <!-- TERMINAL PV+ (DC Positive - Left) -->
            <g
              class="terminal cursor-pointer group/pvpos"
              transform="translate(30, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'PV+', 'dc_pos', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'PV+', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <title>Solar PV+ Positive Terminal</title>
              <circle r="7" fill="#dc2626" stroke="#fecaca" stroke-width="1.5" class="group-hover/pvpos:scale-125" />
              <text x="0" y="2.5" text-anchor="middle" font-size="7" font-weight="900" fill="#ffffff">+</text>
              <text x="0" y="-10" text-anchor="middle" font-size="6" font-weight="bold" fill="#ef4444">PV+</text>
            </g>

            <!-- TERMINAL PV- (DC Negative - Right) -->
            <g
              class="terminal cursor-pointer group/pvneg"
              transform="translate({w - 30}, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'PV-', 'dc_neg', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'PV-', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <title>Solar PV- Negative Terminal</title>
              <circle r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" class="group-hover/pvneg:scale-125" />
              <text x="0" y="2.5" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">-</text>
              <text x="0" y="-10" text-anchor="middle" font-size="6" font-weight="bold" fill="#cbd5e1">PV-</text>
            </g>

          <!-- 2. BATTERY (Energy Storage Server-Rack / LiFePO4 Module) -->
          {:else if eq.type === 'battery'}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              rx="6"
              fill="#18181b"
              stroke={isSelected ? '#38bdf8' : '#71717a'}
              stroke-width={isSelected ? 3 : 1.5}
              class="hover:stroke-emerald-400"
            />
            <!-- Green Energy Storage Accent Bar -->
            <rect x="0" y="0" width={w} height="4" rx="2" fill="#10b981" />
            <!-- Battery Status LEDs / SoC Meter -->
            <g transform="translate(18, 30)">
              {#each Array(5) as _, i}
                <rect x={i * 9} y="0" width="6" height="5" rx="1" fill="#10b981" opacity={0.6 + i * 0.1} />
              {/each}
              <text x="56" y="5" font-size="5.5" font-weight="bold" fill="#10b981" font-family="monospace">SoC 100%</text>
            </g>
            <!-- Large Autocalculated Capacity (kWh) -->
            <text x={w / 2} y={h / 2 + 10} font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">
              {((eq.whCalculated || (eq.batteryVoltage || 51.2) * (eq.capacityAh || 100)) / 1000).toFixed(2)} kWh
            </text>
            <!-- Voltage & Ah Subtitle -->
            <text x={w / 2} y={h / 2 + 23} font-size="7" font-weight="bold" fill="#a1a1aa" text-anchor="middle" font-family="monospace">
              {eq.batteryVoltage || 51.2}V • {eq.capacityAh || 100}Ah ({eq.chemistry || 'LiFePO4'})
            </text>
            <text x={w / 2} y={h - 10} font-size="7.5" font-weight="bold" fill="#f4f4f5" text-anchor="middle">
              {eq.label}
            </text>

            <!-- TERMINAL BAT+ (Left) -->
            <g
              class="terminal cursor-pointer group/batpos"
              transform="translate(32, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'BAT+', 'dc_pos', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'BAT+', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <title>Battery Positive (BAT+)</title>
              <circle r="7" fill="#dc2626" stroke="#fecaca" stroke-width="1.5" class="group-hover/batpos:scale-125" />
              <text x="0" y="2.5" text-anchor="middle" font-size="7" font-weight="900" fill="#ffffff">+</text>
              <text x="0" y="-10" text-anchor="middle" font-size="6" font-weight="bold" fill="#ef4444">BAT+</text>
            </g>

            <!-- TERMINAL BAT- (Right) -->
            <g
              class="terminal cursor-pointer group/batneg"
              transform="translate({w - 32}, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'BAT-', 'dc_neg', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'BAT-', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <title>Battery Negative (BAT-)</title>
              <circle r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" class="group-hover/batneg:scale-125" />
              <text x="0" y="2.5" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">-</text>
              <text x="0" y="-10" text-anchor="middle" font-size="6" font-weight="bold" fill="#cbd5e1">BAT-</text>
            </g>

          <!-- 3. MCCB (Molded Case Circuit Breaker) -->
          {:else if eq.type === 'mccb'}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              rx="6"
              fill="#1e293b"
              stroke={isSelected ? '#38bdf8' : '#64748b'}
              stroke-width={isSelected ? 3 : 1.5}
              class="hover:stroke-orange-400"
            />
            <!-- Center Switch Body Inset -->
            <rect x="10" y="32" width={w - 20} height={h - 64} rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
            <!-- Center Heavy Duty Toggle Handle -->
            <rect x={w / 2 - 12} y={h / 2 - 20} width="24" height="40" rx="3" fill="#334155" stroke="#475569" stroke-width="1" />
            <rect x={w / 2 - 8} y={h / 2 - 16} width="16" height="14" rx="2" fill="#ef4444" />
            <text x={w / 2} y={h / 2 - 6} font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">ON</text>
            <!-- Push to Trip Red Button -->
            <circle cx={w / 2 + 24} cy={h / 2 + 10} r="3.5" fill="#ef4444" stroke="#991b1b" stroke-width="0.8" />
            <!-- Amp Rating & Specs -->
            <text x={w / 2} y={h / 2 + 38} font-size="9" font-weight="900" fill="#f8fafc" text-anchor="middle" font-family="monospace">
              MCCB {eq.ratedAmps || 160}A
            </text>
            <text x={w / 2} y={h / 2 + 47} font-size="6" font-weight="bold" fill="#94a3b8" text-anchor="middle">
              {eq.poles || 2}P • {eq.breakingCapacityKa || 36}kA Icu
            </text>

            <!-- Line In Terminals (Top) -->
            <g
              class="terminal cursor-pointer group/mccbl1in"
              transform="translate(28, 14)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'L1_IN', 'line1', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'L1_IN', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" class="group-hover/mccbl1in:scale-125" />
              <text x="0" y="-9" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#2563eb">L1 IN</text>
            </g>
            <g
              class="terminal cursor-pointer group/mccbl2in"
              transform="translate({w - 28}, 14)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'L2_IN', 'line2', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'L2_IN', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" class="group-hover/mccbl2in:scale-125" />
              <text x="0" y="-9" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#dc2626">L2 IN</text>
            </g>

            <!-- Load Out Terminals (Bottom) -->
            <g
              class="terminal cursor-pointer group/mccbl1out"
              transform="translate(28, {h - 14})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'L1_OUT', 'line1', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'L1_OUT', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" class="group-hover/mccbl1out:scale-125" />
              <text x="0" y="14" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#2563eb">L1 OUT</text>
            </g>
            <g
              class="terminal cursor-pointer group/mccbl2out"
              transform="translate({w - 28}, {h - 14})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'L2_OUT', 'line2', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'L2_OUT', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" class="group-hover/mccbl2out:scale-125" />
              <text x="0" y="14" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#dc2626">L2 OUT</text>
            </g>

          <!-- 4. HYBRID INVERTER -->
          {:else if eq.type === 'hybrid_inverter'}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              rx="8"
              fill="#f8fafc"
              stroke={isSelected ? '#2563eb' : '#94a3b8'}
              stroke-width={isSelected ? 3 : 1.5}
              class="hover:stroke-blue-400"
            />
            <!-- Top Inverter Blue Accent Header -->
            <rect x="0" y="0" width={w} height="6" rx="3" fill="#2563eb" />
            <!-- Large LCD Screen -->
            <rect x="14" y="34" width={w - 28} height="80" rx="4" fill="#091428" stroke="#1e293b" stroke-width="1.2" />
            <!-- Interactive Inverter Flow Schematic on Screen -->
            <text x={w / 2} y="50" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="monospace">
              HYBRID INVERTER {eq.capacityKw || 8}kW
            </text>
            <!-- Flow Icons -->
            <g transform="translate({w / 2 - 55}, 60)" font-size="7.5" fill="#e2e8f0" font-family="monospace">
              <text x="0" y="10">☀️ PV</text>
              <text x="36" y="10">➔ ⚡ ➔</text>
              <text x="75" y="10">🏠 LOAD</text>
              <text x="0" y="28">🔋 BAT</text>
              <text x="36" y="28">⇄ ⚡ ⇄</text>
              <text x="75" y="28">🏢 GRID</text>
            </g>
            <!-- Status LEDs -->
            <g transform="translate(18, 126)">
              <circle cx="8" cy="0" r="3" fill="#22c55e" />
              <text x="15" y="3" font-size="6" font-weight="bold" fill="#475569">NORMAL</text>
              <circle cx="60" cy="0" r="3" fill="#3b82f6" />
              <text x="67" y="3" font-size="6" font-weight="bold" fill="#475569">INVERT</text>
              <circle cx="112" cy="0" r="3" fill="#ef4444" />
              <text x="119" y="3" font-size="6" font-weight="bold" fill="#475569">ALARM</text>
            </g>
            <text x={w / 2} y={h - 34} font-size="8" font-weight="900" fill="#0f172a" text-anchor="middle">
              {eq.label}
            </text>

            <!-- TOP TERMINALS: Solar PV (Left) & Battery (Right) -->
            <!-- PV1+ -->
            <g
              class="terminal cursor-pointer group/pv1pos"
              transform="translate(28, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'PV1+', 'dc_pos', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'PV1+', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/pv1pos:scale-125 transition-transform" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">PV+</text>
            </g>
            <!-- PV1- -->
            <g
              class="terminal cursor-pointer group/pv1neg"
              transform="translate(56, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'PV1-', 'dc_neg', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'PV1-', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2" class="group-hover/pv1neg:scale-125 transition-transform" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#475569">PV-</text>
            </g>
            <!-- BAT+ -->
            <g
              class="terminal cursor-pointer group/hybbatpos"
              transform="translate({w - 56}, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'BAT+', 'dc_pos', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'BAT+', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/hybbatpos:scale-125 transition-transform" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">BAT+</text>
            </g>
            <!-- BAT- -->
            <g
              class="terminal cursor-pointer group/hybbatneg"
              transform="translate({w - 26}, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'BAT-', 'dc_neg', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'BAT-', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2" class="group-hover/hybbatneg:scale-125 transition-transform" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#475569">BAT-</text>
            </g>

            <!-- BOTTOM TERMINALS: AC GRID IN & AC LOAD OUT -->
            <!-- AC_IN_L -->
            <g
              class="terminal cursor-pointer group/acinl"
              transform="translate(26, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_IN_L', 'line1', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_IN_L', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5" fill="#2563eb" stroke="#bfdbfe" stroke-width="1.2" class="group-hover/acinl:scale-125 transition-transform" />
              <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#2563eb">GRID L</text>
            </g>
            <!-- AC_IN_N -->
            <g
              class="terminal cursor-pointer group/acinn"
              transform="translate(50, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_IN_N', 'neutral', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_IN_N', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.2" class="group-hover/acinn:scale-125 transition-transform" />
              <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#0284c7">GRID N</text>
            </g>
            <!-- AC_IN_PE -->
            <g
              class="terminal cursor-pointer group/acinpe"
              transform="translate(74, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_IN_PE', 'earth', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_IN_PE', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2" class="group-hover/acinpe:scale-125 transition-transform" />
              <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#16a34a">PE</text>
            </g>

            <!-- AC_OUT_L -->
            <g
              class="terminal cursor-pointer group/acoutl"
              transform="translate({w - 74}, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_OUT_L', 'line1', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_OUT_L', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/acoutl:scale-125 transition-transform" />
              <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#dc2626">LOAD L</text>
            </g>
            <!-- AC_OUT_N -->
            <g
              class="terminal cursor-pointer group/acoutn"
              transform="translate({w - 50}, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_OUT_N', 'neutral', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_OUT_N', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.2" class="group-hover/acoutn:scale-125 transition-transform" />
              <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#0284c7">LOAD N</text>
            </g>
            <!-- AC_OUT_PE -->
            <g
              class="terminal cursor-pointer group/acoutpe"
              transform="translate({w - 26}, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_OUT_PE', 'earth', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_OUT_PE', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2" class="group-hover/acoutpe:scale-125" />
              <text x="0" y="12" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#16a34a">PE</text>
            </g>

          <!-- 5. OFFGRID INVERTER -->
          {:else if eq.type === 'offgrid_inverter'}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              rx="8"
              fill="#0f172a"
              stroke={isSelected ? '#38bdf8' : '#334155'}
              stroke-width={isSelected ? 3 : 1.5}
              class="hover:stroke-cyan-400"
            />
            <!-- Cyan Offgrid Accent Bar -->
            <rect x="0" y="0" width={w} height="5" rx="2" fill="#06b6d4" />
            <!-- Inverter Screen -->
            <rect x="14" y="32" width={w - 28} height="70" rx="4" fill="#0284c7" fill-opacity="0.15" stroke="#0284c7" stroke-width="1" />
            <text x={w / 2} y="48" font-size="8.5" font-weight="900" fill="#38bdf8" text-anchor="middle" font-family="monospace">
              OFF-GRID {eq.capacityKw || 5}kW
            </text>
            <!-- Sine Wave Graphic -->
            <path d="M {w/2 - 25} 66 Q {w/2 - 12.5} 56, {w/2} 66 T {w/2 + 25} 66" fill="none" stroke="#38bdf8" stroke-width="2" />
            <text x={w / 2} y="82" font-size="6" font-weight="bold" fill="#bae6fd" text-anchor="middle" font-family="monospace">
              PURE SINE WAVE (48V)
            </text>
            <text x={w / 2} y={h - 32} font-size="8" font-weight="bold" fill="#f8fafc" text-anchor="middle">
              {eq.label}
            </text>

            <!-- TOP TERMINALS: PV & BATTERY -->
            <g
              class="terminal cursor-pointer group/ogpvpos"
              transform="translate(32, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'PV+', 'dc_pos', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'PV+', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/ogpvpos:scale-125" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">PV+</text>
            </g>
            <g
              class="terminal cursor-pointer group/ogpvneg"
              transform="translate(60, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'PV-', 'dc_neg', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'PV-', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#334155" stroke="#94a3b8" stroke-width="1.2" class="group-hover/ogpvneg:scale-125" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#cbd5e1">PV-</text>
            </g>
            <g
              class="terminal cursor-pointer group/ogbatpos"
              transform="translate({w - 60}, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'BAT+', 'dc_pos', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'BAT+', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/ogbatpos:scale-125" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#ef4444">BAT+</text>
            </g>
            <g
              class="terminal cursor-pointer group/ogbatneg"
              transform="translate({w - 32}, 16)"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'BAT-', 'dc_neg', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'BAT-', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#334155" stroke="#94a3b8" stroke-width="1.2" class="group-hover/ogbatneg:scale-125" />
              <text x="0" y="-8" text-anchor="middle" font-size="5" font-weight="bold" fill="#cbd5e1">BAT-</text>
            </g>

            <!-- BOTTOM TERMINALS: AC OUT (L, N, PE) -->
            <g
              class="terminal cursor-pointer group/ogacoutl"
              transform="translate(36, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_OUT_L', 'line1', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_OUT_L', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#dc2626" stroke="#fecaca" stroke-width="1.2" class="group-hover/ogacoutl:scale-125" />
              <text x="0" y="12" text-anchor="middle" font-size="5" font-weight="bold" fill="#dc2626">LOAD L</text>
            </g>
            <g
              class="terminal cursor-pointer group/ogacoutn"
              transform="translate(72, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_OUT_N', 'neutral', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_OUT_N', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.2" class="group-hover/ogacoutn:scale-125" />
              <text x="0" y="12" text-anchor="middle" font-size="5" font-weight="bold" fill="#0284c7">LOAD N</text>
            </g>
            <g
              class="terminal cursor-pointer group/ogacoutpe"
              transform="translate(108, {h - 16})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, 'AC_OUT_PE', 'earth', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, 'AC_OUT_PE', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <circle r="5.5" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2" class="group-hover/ogacoutpe:scale-125" />
              <text x="0" y="12" text-anchor="middle" font-size="5" font-weight="bold" fill="#16a34a">PE</text>
            </g>

          <!-- 6. DETACHED FIELD CONNECTION BLOCK (Junction / External I/O) -->
          {:else}
            {@const isTop = eq.terminalPosition !== 'bottom'}
            {@const termY = isTop ? 14 : h - 14}
            {@const words = eq.label.split(' ')}
            {@const line1 = words.length > 1 && eq.label.length > 10 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : eq.label}
            {@const line2 = words.length > 1 && eq.label.length > 10 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''}

            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              rx="6"
              fill="#ffffff"
              stroke={isSelected ? '#2563eb' : '#94a3b8'}
              stroke-width={isSelected ? 3 : 1.5}
              class="hover:stroke-amber-400"
            />
            <rect x="0" y="0" width={w} height="4" rx="2" fill="#f59e0b" />
            <rect x={w / 2 - 25} y={isTop ? 27 : 7} width="50" height="9" rx="2" fill="#fef3c7" stroke="#f59e0b" stroke-width="0.6" />
            <text x={w / 2} y={isTop ? 33.5 : 13.5} font-size="5" font-weight="900" fill="#b45309" text-anchor="middle" font-family="monospace">
              FIELD I/O
            </text>

            {#if line2}
              <text x={w / 2} y={isTop ? 46 : 28} font-size="7.5" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="system-ui, sans-serif">
                {line1}
              </text>
              <text x={w / 2} y={isTop ? 56 : 38} font-size="7.5" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="system-ui, sans-serif">
                {line2}
              </text>
            {:else}
              <text x={w / 2} y={isTop ? 50 : 33} font-size="8.5" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="system-ui, sans-serif">
                {line1}
              </text>
            {/if}

            <text x={w / 2} y={isTop ? 66 : 48} font-size="5.5" font-weight="bold" fill="#64748b" text-anchor="middle" font-family="system-ui, sans-serif">
              {eq.description || '230V 2-Wire'}
            </text>

            <!-- TERMINAL 1 (Line 1) -->
            <g
              class="terminal cursor-pointer group/term1"
              transform="translate(24, {termY})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, '1', 'line1', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, '1', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <title>Terminal 1 (L / Line 1)</title>
              <circle r="6" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5" class="group-hover/term1:stroke-blue-500 group-hover/term1:scale-125" />
              <line x1="-3" y1="-2" x2="3" y2="2" stroke="#475569" stroke-width="1.5" />
              <circle r="4" fill="#3b82f6" class="opacity-0 group-hover/term1:opacity-100" />
              <text x="0" y={isTop ? -9 : 14} text-anchor="middle" font-size="5.5" font-weight="bold" fill="#2563eb">1 (L)</text>
            </g>

            <!-- TERMINAL 2 (Neutral / Line 2) -->
            <g
              class="terminal cursor-pointer group/term2"
              transform="translate({w - 24}, {termY})"
              onmousedown={(e) => handleEquipmentTerminalMouseDown(eq.id, '2', 'neutral', e)}
              onmouseup={(e) => handleTerminalMouseUp(eq.id, '2', e)}
              onclick={(e) => e.stopPropagation()}
              role="button"
              tabindex="0"
            >
              <circle r="14" fill="transparent" />
              <title>Terminal 2 (N / Line 2)</title>
              <circle r="6" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5" class="group-hover/term2:stroke-blue-500 group-hover/term2:scale-125" />
              <line x1="-3" y1="-2" x2="3" y2="2" stroke="#475569" stroke-width="1.5" />
              <circle r="4" fill="#3b82f6" class="opacity-0 group-hover/term2:opacity-100" />
              <text x="0" y={isTop ? -9 : 14} text-anchor="middle" font-size="5.5" font-weight="bold" fill="#dc2626">2 (N)</text>
            </g>
          {/if}
        </g>
      {/each}

      <!-- ROUTED WIRES -->
      {#each panelStore.wires as wire (wire.id)}
        {@const src = getTerminalCoords(wire.sourceDeviceId, wire.sourceTerminalId)}
        {@const tgt = getTerminalCoords(wire.targetDeviceId, wire.targetTerminalId)}
        {#if src && tgt}
          {@const gauge = getGaugeDef(wire.gaugeMetric)}
          {@const isSelected = panelStore.selectedType === 'wire' && panelStore.selectedId === wire.id}
          {@const isDark = isDarkWireColor(wire.color)}
          {@const pathD = generateWirePath(src, tgt, wire.waypoints || [], wire.routingMode || 'orthogonal')}

          <g
            class="wire-group cursor-pointer group"
            pointer-events={panelStore.wireDraft || panelStore.activeTool === 'wire' ? 'none' : 'auto'}
            onmousedown={(e) => {
              if (e.button !== 0) return;
              const rect = getSvgRect();
              if (!rect) return;
              const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
              const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;
              if (Math.hypot(rawX - src.x, rawY - src.y) <= 15) {
                handleTerminalMouseDown(wire.sourceDeviceId, wire.sourceTerminalId, e);
                return;
              }
              if (Math.hypot(rawX - tgt.x, rawY - tgt.y) <= 15) {
                handleTerminalMouseDown(wire.targetDeviceId, wire.targetTerminalId, e);
                return;
              }
            }}
            onclick={(e) => {
              e.stopPropagation();
              const rect = getSvgRect();
              if (rect) {
                const rawX = (e.clientX - rect.left - panelStore.pan.x) / panelStore.zoom;
                const rawY = (e.clientY - rect.top - panelStore.pan.y) / panelStore.zoom;
                if (
                  Math.hypot(rawX - src.x, rawY - src.y) <= 15 ||
                  Math.hypot(rawX - tgt.x, rawY - tgt.y) <= 15
                ) {
                  return;
                }
              }
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
              stroke-width={gauge.renderWidth + 8}
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:stroke-blue-400/50"
            />

            <!-- High-Contrast Cable Sheath Casing (makes black L1/Hot wires stand out crisply in dark mode) -->
            <path
              d={pathD}
              fill="none"
              stroke={isDark ? '#cbd5e1' : '#020617'}
              stroke-width={isDark ? gauge.renderWidth + 2.6 : gauge.renderWidth + 1.4}
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity={isDark ? 0.92 : 0.45}
            />

            <!-- Wire Outer Core -->
            <path
              d={pathD}
              fill="none"
              stroke={isDark ? '#0f172a' : wire.color}
              stroke-width={gauge.renderWidth}
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Cylindrical Insulation Specular Sheen for Black / Dark Conductors -->
            {#if isDark}
              <path
                d={pathD}
                fill="none"
                stroke="#94a3b8"
                stroke-width={Math.max(1, gauge.renderWidth * 0.22)}
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.65"
              />
            {/if}

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
            <circle cx={src.x} cy={src.y} r="3.8" pointer-events="none" fill={isDark ? '#0f172a' : '#ffffff'} stroke={isDark ? '#f8fafc' : wire.color} stroke-width="1.8" />
            <circle cx={tgt.x} cy={tgt.y} r="3.8" pointer-events="none" fill={isDark ? '#0f172a' : '#ffffff'} stroke={isDark ? '#f8fafc' : wire.color} stroke-width="1.8" />

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
                  <circle r="14" fill="transparent" />
                  <circle
                    r="6.5"
                    fill="#ffffff"
                    stroke="#2563eb"
                    stroke-width="2.5"
                    class="hover:scale-125"
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
          {@const draftColor = getWireColor(panelStore.activeWireRole, panelStore.activePanel.wireStandard)}
          {@const isDraftDark = isDarkWireColor(draftColor.hex)}
          {@const draftPath = generateWirePath(
            srcCoords,
            { x: panelStore.wireDraft.currentX, y: panelStore.wireDraft.currentY },
            [],
            panelStore.activeWireRouting
          )}
          <g class="pointer-events-none" pointer-events="none">
            {#if isDraftDark}
              <path
                d={draftPath}
                fill="none"
                stroke="#e2e8f0"
                stroke-width={draftGauge.renderWidth + 2.8}
                stroke-dasharray="6,4"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.9"
              />
            {/if}
            <path
              d={draftPath}
              fill="none"
              stroke={isDraftDark ? '#0f172a' : draftColor.hex}
              stroke-width={draftGauge.renderWidth}
              stroke-dasharray="6,4"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="animate-pulse"
            />
            <circle cx={srcCoords.x} cy={srcCoords.y} r="4" fill="#3b82f6" />
            <circle cx={panelStore.wireDraft.currentX} cy={panelStore.wireDraft.currentY} r="5" fill="#60a5fa" />
          </g>
        {/if}
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
