import type {
  CombBusbar,
  DRCWarning,
  DeviceCategory,
  PanelConfig,
  PlacedDevice,
  TerminalPosition,
  WireConnection,
  WireRole,
  WireStandard
} from './types';
import { DEVICE_CATALOG, getDeviceDef } from './catalog';
import { getWireColor, WIRE_GAUGES } from './wireStandards';
import { runDesignRuleCheck } from './drc';

export interface HistoryState {
  devices: PlacedDevice[];
  wires: WireConnection[];
  busbars: CombBusbar[];
  config: PanelConfig;
}

export class PanelState {
  config = $state<PanelConfig>({
    name: 'Residential Distribution Board',
    rows: 2,
    slotsPerRow: 12,
    wireStandard: 'PEC',
    hasGroundBar: true,
    hasNeutralBar: true,
    groundBarSlots: 12,
    neutralBarSlots: 12
  });

  devices = $state<PlacedDevice[]>([]);
  wires = $state<WireConnection[]>([]);
  busbars = $state<CombBusbar[]>([]);

  selectedId = $state<string | null>(null);
  selectedType = $state<'device' | 'wire' | 'busbar' | null>(null);

  activeTool = $state<'select' | 'wire' | 'busbar' | 'place'>('select');
  pendingPlaceTypeId = $state<string | null>(null);

  activeWireRole = $state<WireRole>('line1');
  activeWireGauge = $state<number>(2.5); // 2.5 mm^2
  activeWireRouting = $state<'curved' | 'orthogonal'>('curved');
  activeBusbarType = $state<'1P' | '1P+N' | '2P' | '3P'>('1P');

  // Interactive wire drafting
  wireDraft = $state<{
    sourceDeviceId: string;
    sourceTerminalId: string;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Canvas viewport
  zoom = $state<number>(1.0);
  pan = $state<{ x: number; y: number }>({ x: 40, y: 40 });

  // History stack for undo/redo
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  // Derived calculations
  drcWarnings = $derived<DRCWarning[]>(
    runDesignRuleCheck(this.config, this.devices, this.wires)
  );

  selectedDevice = $derived<PlacedDevice | undefined>(
    this.selectedType === 'device' ? this.devices.find((d) => d.id === this.selectedId) : undefined
  );

  selectedWire = $derived<WireConnection | undefined>(
    this.selectedType === 'wire' ? this.wires.find((w) => w.id === this.selectedId) : undefined
  );

  selectedBusbar = $derived<CombBusbar | undefined>(
    this.selectedType === 'busbar' ? this.busbars.find((b) => b.id === this.selectedId) : undefined
  );

  constructor() {
    this.initFromLocalStorage();
  }

  private saveHistory() {
    const snap: HistoryState = {
      devices: JSON.parse(JSON.stringify(this.devices)),
      wires: JSON.parse(JSON.stringify(this.wires)),
      busbars: JSON.parse(JSON.stringify(this.busbars)),
      config: JSON.parse(JSON.stringify(this.config))
    };
    this.undoStack.push(JSON.stringify(snap));
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.redoStack = [];
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        config: this.config,
        devices: this.devices,
        wires: this.wires,
        busbars: this.busbars
      };
      localStorage.setItem('circuit_breaker_planner_data', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  initFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('circuit_breaker_planner_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.config) this.config = parsed.config;
        if (parsed.devices) this.devices = parsed.devices;
        if (parsed.wires) this.wires = parsed.wires;
        if (parsed.busbars) this.busbars = parsed.busbars;
        return;
      }
    } catch (e) {
      console.warn('Could not restore from localStorage:', e);
    }
    // If empty, load sample initial project
    this.loadSampleProject();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const currentState: HistoryState = {
      devices: this.devices,
      wires: this.wires,
      busbars: this.busbars,
      config: this.config
    };
    this.redoStack.push(JSON.stringify(currentState));

    const prevRaw = this.undoStack.pop();
    if (!prevRaw) return;
    const prev: HistoryState = JSON.parse(prevRaw);
    this.devices = prev.devices;
    this.wires = prev.wires;
    this.busbars = prev.busbars;
    this.config = prev.config;
    this.saveToLocalStorage();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const nextRaw = this.redoStack.pop();
    if (!nextRaw) return;

    const currentState: HistoryState = {
      devices: this.devices,
      wires: this.wires,
      busbars: this.busbars,
      config: this.config
    };
    this.undoStack.push(JSON.stringify(currentState));

    const next: HistoryState = JSON.parse(nextRaw);
    this.devices = next.devices;
    this.wires = next.wires;
    this.busbars = next.busbars;
    this.config = next.config;
    this.saveToLocalStorage();
  }

  // Selection
  select(type: 'device' | 'wire' | 'busbar' | null, id: string | null) {
    this.selectedType = type;
    this.selectedId = id;
  }

  clearSelection() {
    this.selectedType = null;
    this.selectedId = null;
  }

  // Device Placement
  canPlaceDevice(railIndex: number, slotIndex: number, widthModules: number, excludeDeviceId?: string): boolean {
    if (slotIndex < 0 || slotIndex + widthModules > this.config.slotsPerRow) return false;
    // Check collisions with other devices on the same rail
    return !this.devices.some((d) => {
      if (d.id === excludeDeviceId) return false;
      if (d.railIndex !== railIndex) return false;
      const dEnd = d.slotIndex + d.widthModules;
      const targetEnd = slotIndex + widthModules;
      return Math.max(d.slotIndex, slotIndex) < Math.min(dEnd, targetEnd);
    });
  }

  placeDevice(typeId: string, railIndex: number, slotIndex: number): PlacedDevice | null {
    const def = getDeviceDef(typeId);
    if (!def) return null;

    if (!this.canPlaceDevice(railIndex, slotIndex, def.widthModules)) {
      return null;
    }

    this.saveHistory();
    const newDevice: PlacedDevice = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      typeId,
      railIndex,
      slotIndex,
      widthModules: def.widthModules,
      customLabel: def.poles === 1 ? `MCB-${this.devices.length + 1}` : def.name.split(' ')[0],
      circuitDescription: def.category === 'main_switch' ? 'Main Incomer' : 'Branch Circuit',
      ratedAmps: def.ratedAmps,
      curve: def.curve
    };

    this.devices.push(newDevice);
    this.select('device', newDevice.id);
    this.saveToLocalStorage();
    return newDevice;
  }

  moveDevice(deviceId: string, railIndex: number, newSlotIndex: number): boolean {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (!dev) return false;

    if (!this.canPlaceDevice(railIndex, newSlotIndex, dev.widthModules, deviceId)) {
      return false;
    }

    this.saveHistory();
    dev.railIndex = railIndex;
    dev.slotIndex = newSlotIndex;
    this.saveToLocalStorage();
    return true;
  }

  removeDevice(deviceId: string) {
    this.saveHistory();
    this.devices = this.devices.filter((d) => d.id !== deviceId);
    // Remove connected wires
    this.wires = this.wires.filter(
      (w) => w.sourceDeviceId !== deviceId && w.targetDeviceId !== deviceId
    );
    if (this.selectedId === deviceId) {
      this.clearSelection();
    }
    this.saveToLocalStorage();
  }

  updateDevice(deviceId: string, updates: Partial<PlacedDevice>) {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (!dev) return;
    this.saveHistory();
    Object.assign(dev, updates);
    this.saveToLocalStorage();
  }

  // Wiring interactions
  startWireDraft(sourceDeviceId: string, sourceTerminalId: string, startX: number, startY: number) {
    this.wireDraft = {
      sourceDeviceId,
      sourceTerminalId,
      currentX: startX,
      currentY: startY
    };
  }

  updateWireDraftPoint(x: number, y: number) {
    if (this.wireDraft) {
      this.wireDraft.currentX = x;
      this.wireDraft.currentY = y;
    }
  }

  completeWireDraft(targetDeviceId: string, targetTerminalId: string): boolean {
    if (!this.wireDraft) return false;
    const { sourceDeviceId, sourceTerminalId } = this.wireDraft;

    // Disallow self-terminal loop
    if (sourceDeviceId === targetDeviceId && sourceTerminalId === targetTerminalId) {
      this.cancelWireDraft();
      return false;
    }

    // Check if identical wire already exists
    const duplicate = this.wires.some(
      (w) =>
        (w.sourceDeviceId === sourceDeviceId &&
          w.sourceTerminalId === sourceTerminalId &&
          w.targetDeviceId === targetDeviceId &&
          w.targetTerminalId === targetTerminalId) ||
        (w.sourceDeviceId === targetDeviceId &&
          w.sourceTerminalId === targetTerminalId &&
          w.targetDeviceId === sourceDeviceId &&
          w.targetTerminalId === sourceTerminalId)
    );

    if (duplicate) {
      this.cancelWireDraft();
      return false;
    }

    this.saveHistory();
    const colorDef = getWireColor(this.activeWireRole, this.config.wireStandard);

    const newWire: WireConnection = {
      id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceDeviceId,
      sourceTerminalId,
      targetDeviceId,
      targetTerminalId,
      role: this.activeWireRole,
      color: colorDef.hex,
      gaugeMetric: this.activeWireGauge,
      standard: this.config.wireStandard,
      routingMode: this.activeWireRouting
    };

    this.wires.push(newWire);
    this.wireDraft = null;
    this.select('wire', newWire.id);
    this.saveToLocalStorage();
    return true;
  }

  cancelWireDraft() {
    this.wireDraft = null;
  }

  removeWire(wireId: string) {
    this.saveHistory();
    this.wires = this.wires.filter((w) => w.id !== wireId);
    if (this.selectedId === wireId) {
      this.clearSelection();
    }
    this.saveToLocalStorage();
  }

  // Busbar Management
  addBusbar(
    railIndex: number,
    position: TerminalPosition,
    busbarType: '1P' | '1P+N' | '2P' | '3P',
    startSlot: number,
    slotSpan: number
  ) {
    this.saveHistory();
    const newBusbar: CombBusbar = {
      id: `busbar_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      railIndex,
      position,
      busbarType,
      startSlot,
      slotSpan
    };
    this.busbars.push(newBusbar);
    this.select('busbar', newBusbar.id);
    this.saveToLocalStorage();
  }

  removeBusbar(busbarId: string) {
    this.saveHistory();
    this.busbars = this.busbars.filter((b) => b.id !== busbarId);
    if (this.selectedId === busbarId) {
      this.clearSelection();
    }
    this.saveToLocalStorage();
  }

  // Presets & Project Setup
  applyPreset(presetName: string) {
    this.saveHistory();
    switch (presetName) {
      case '1-Row 12M':
        this.config.rows = 1;
        this.config.slotsPerRow = 12;
        break;
      case '2-Row 24M':
        this.config.rows = 2;
        this.config.slotsPerRow = 12;
        break;
      case '3-Row 36M':
        this.config.rows = 3;
        this.config.slotsPerRow = 12;
        break;
      case '2-Row 36M':
        this.config.rows = 2;
        this.config.slotsPerRow = 18;
        break;
      case '4-Row 48M':
        this.config.rows = 4;
        this.config.slotsPerRow = 12;
        break;
    }
    this.saveToLocalStorage();
  }

  clearProject() {
    this.saveHistory();
    this.devices = [];
    this.wires = [];
    this.busbars = [];
    this.clearSelection();
    this.saveToLocalStorage();
  }

  loadSampleProject() {
    this.config = {
      name: 'Residential Panel (Philippine Standard)',
      rows: 2,
      slotsPerRow: 12,
      wireStandard: 'PEC',
      hasGroundBar: true,
      hasNeutralBar: true,
      groundBarSlots: 12,
      neutralBarSlots: 12
    };

    const d1: PlacedDevice = {
      id: 'dev_incomer',
      typeId: 'isolator-2p-63a',
      railIndex: 0,
      slotIndex: 0,
      widthModules: 2,
      customLabel: 'MAIN',
      circuitDescription: '63A 230V Main Incomer',
      ratedAmps: 63
    };

    const d2: PlacedDevice = {
      id: 'dev_spd',
      typeId: 'spd-2p-t2',
      railIndex: 0,
      slotIndex: 2,
      widthModules: 2,
      customLabel: 'SPD',
      circuitDescription: 'Surge Protection Type 2'
    };

    const d3: PlacedDevice = {
      id: 'dev_rcd',
      typeId: 'rcd-2p-40a-30ma',
      railIndex: 0,
      slotIndex: 5,
      widthModules: 2,
      customLabel: 'RCD-1',
      circuitDescription: '40A 30mA Ground Fault Protection',
      ratedAmps: 40
    };

    const d4: PlacedDevice = {
      id: 'dev_mcb1',
      typeId: 'mcb-1p-20a',
      railIndex: 1,
      slotIndex: 0,
      widthModules: 1,
      customLabel: 'Q1',
      circuitDescription: 'Kitchen Convenience Outlets',
      ratedAmps: 20
    };

    const d5: PlacedDevice = {
      id: 'dev_mcb2',
      typeId: 'mcb-1p-16a',
      railIndex: 1,
      slotIndex: 1,
      widthModules: 1,
      customLabel: 'Q2',
      circuitDescription: 'Lighting Circuit (Living & Dining)',
      ratedAmps: 16
    };

    const d6: PlacedDevice = {
      id: 'dev_rcbo1',
      typeId: 'rcbo-2p-32a-30ma',
      railIndex: 1,
      slotIndex: 3,
      widthModules: 2,
      customLabel: 'Q3',
      circuitDescription: 'Master Bedroom Inverter AC',
      ratedAmps: 32
    };

    this.devices = [d1, d2, d3, d4, d5, d6];

    // Manual Comb busbar on Row 1 bottom terminals
    const b1: CombBusbar = {
      id: 'busbar_row2_in',
      railIndex: 1,
      position: 'top',
      busbarType: '1P',
      startSlot: 0,
      slotSpan: 2
    };
    this.busbars = [b1];

    // Sample wiring (PEC standard: Line 1 Black, Line 2 Red, PE Green)
    this.wires = [
      {
        id: 'wire_main_to_spd_l',
        sourceDeviceId: 'dev_incomer',
        sourceTerminalId: 'L_OUT',
        targetDeviceId: 'dev_spd',
        targetTerminalId: 'L',
        role: 'line1',
        color: '#111827',
        gaugeMetric: 10.0,
        standard: 'PEC',
        routingMode: 'curved'
      },
      {
        id: 'wire_main_to_spd_n',
        sourceDeviceId: 'dev_incomer',
        sourceTerminalId: 'N_OUT',
        targetDeviceId: 'dev_spd',
        targetTerminalId: 'N',
        role: 'line2',
        color: '#dc2626',
        gaugeMetric: 10.0,
        standard: 'PEC',
        routingMode: 'curved'
      },
      {
        id: 'wire_spd_pe',
        sourceDeviceId: 'dev_spd',
        sourceTerminalId: 'PE',
        targetDeviceId: 'PE_BAR',
        targetTerminalId: 'G_1',
        role: 'earth',
        color: '#16a34a',
        gaugeMetric: 10.0,
        standard: 'PEC',
        routingMode: 'curved'
      },
      {
        id: 'wire_main_to_rcd_l',
        sourceDeviceId: 'dev_incomer',
        sourceTerminalId: 'L_OUT',
        targetDeviceId: 'dev_rcd',
        targetTerminalId: 'L_IN',
        role: 'line1',
        color: '#111827',
        gaugeMetric: 6.0,
        standard: 'PEC',
        routingMode: 'curved'
      },
      {
        id: 'wire_main_to_rcd_n',
        sourceDeviceId: 'dev_incomer',
        sourceTerminalId: 'N_OUT',
        targetDeviceId: 'dev_rcd',
        targetTerminalId: 'N_IN',
        role: 'line2',
        color: '#dc2626',
        gaugeMetric: 6.0,
        standard: 'PEC',
        routingMode: 'curved'
      },
      {
        id: 'wire_rcd_to_busbar',
        sourceDeviceId: 'dev_rcd',
        sourceTerminalId: 'L_OUT',
        targetDeviceId: 'dev_mcb1',
        targetTerminalId: 'IN',
        role: 'line1',
        color: '#111827',
        gaugeMetric: 4.0,
        standard: 'PEC',
        routingMode: 'curved'
      }
    ];

    this.saveToLocalStorage();
  }

  // Export / Import
  exportJSON(): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        config: this.config,
        devices: this.devices,
        wires: this.wires,
        busbars: this.busbars
      },
      null,
      2
    );
  }

  importJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.config || !Array.isArray(data.devices)) return false;
      this.saveHistory();
      this.config = data.config;
      this.devices = data.devices;
      this.wires = Array.isArray(data.wires) ? data.wires : [];
      this.busbars = Array.isArray(data.busbars) ? data.busbars : [];
      this.clearSelection();
      this.saveToLocalStorage();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  exportBOMCSV(): string {
    const headers = ['Device Name', 'Type', 'Category', 'Modules (TE)', 'Rated Current (A)', 'Circuit Description', 'Quantity'];
    const groups = new Map<string, { defName: string; type: string; category: string; width: number; amps: string; desc: string; count: number }>();

    for (const d of this.devices) {
      const def = getDeviceDef(d.typeId);
      const key = `${d.typeId}_${d.ratedAmps || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          defName: def?.name || d.customLabel,
          type: d.typeId,
          category: def?.category || 'other',
          width: d.widthModules,
          amps: d.ratedAmps ? `${d.ratedAmps}A` : '-',
          desc: d.circuitDescription,
          count: 0
        });
      }
      groups.get(key)!.count += 1;
    }

    const rows = Array.from(groups.values()).map((g) => [
      `"${g.defName}"`,
      `"${g.type}"`,
      `"${g.category}"`,
      g.width,
      `"${g.amps}"`,
      `"${g.desc}"`,
      g.count
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  exportWireScheduleCSV(): string {
    const headers = ['Wire ID', 'From Device', 'From Terminal', 'To Device', 'To Terminal', 'Role', 'Gauge (mm²)', 'Color'];
    const rows = this.wires.map((w) => {
      const srcDev = this.devices.find((d) => d.id === w.sourceDeviceId);
      const tgtDev = this.devices.find((d) => d.id === w.targetDeviceId);
      const srcName = srcDev?.customLabel || w.sourceDeviceId;
      const tgtName = tgtDev?.customLabel || w.targetDeviceId;
      return [
        `"${w.id}"`,
        `"${srcName}"`,
        `"${w.sourceTerminalId}"`,
        `"${tgtName}"`,
        `"${w.targetTerminalId}"`,
        `"${w.role}"`,
        w.gaugeMetric,
        `"${w.color}"`
      ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const panelStore = new PanelState();

