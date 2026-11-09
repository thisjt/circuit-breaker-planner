import type {
  CombBusbar,
  DRCWarning,
  DeviceCategory,
  FieldBlock,
  FreeEquipment,
  FreeEquipmentType,
  PanelConfig,
  PlacedDevice,
  TerminalPosition,
  WireConnection,
  WirePoint,
  WireRole,
  WireStandard
} from './types';
import { DEVICE_CATALOG, getDeviceDef } from './catalog';
import { getWireColor, WIRE_GAUGES } from './wireStandards';
import { runDesignRuleCheck } from './drc';

export interface HistoryState {
  panels: PanelConfig[];
  activePanelId: string;
  devices: PlacedDevice[];
  wires: WireConnection[];
  busbars: CombBusbar[];
  equipment: FreeEquipment[];
}

export class PanelState {
  // Multiple Breaker Panels
  panels = $state<PanelConfig[]>([
    {
      id: 'panel-1',
      name: 'Main Distribution Panel',
      x: 60,
      y: 120,
      rows: 2,
      slotsPerRow: 12,
      railSpacing: 230,
      wireStandard: 'PEC',
      hasGroundBar: true,
      hasNeutralBar: true,
      groundBarSlots: 12,
      neutralBarSlots: 12
    }
  ]);
  activePanelId = $state<string>('panel-1');

  // Modular devices snapped on DIN rails
  devices = $state<PlacedDevice[]>([]);
  wires = $state<WireConnection[]>([]);
  busbars = $state<CombBusbar[]>([]);

  // Free-place Equipment (Solar Panels, Batteries, Inverters, MCCBs, Field Blocks)
  equipment = $state<FreeEquipment[]>([]);

  selectedId = $state<string | null>(null);
  selectedType = $state<'device' | 'wire' | 'busbar' | 'field_block' | 'equipment' | 'panel' | null>(null);

  activeTool = $state<'select' | 'wire' | 'busbar' | 'place'>('select');
  pendingPlaceTypeId = $state<string | null>(null);

  activeWireRole = $state<WireRole>('line1');
  activeWireGauge = $state<number>(2.5); // 2.5 mm^2
  activeWireRouting = $state<'curved' | 'orthogonal'>('orthogonal');
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

  // Active / Selected Panel derived
  get activePanel(): PanelConfig {
    return this.panels.find((p) => p.id === this.activePanelId) || this.panels[0];
  }

  // Full backward compatibility for code reading/writing panelStore.config
  get config(): PanelConfig {
    return this.activePanel;
  }
  set config(newConfig: PanelConfig) {
    const idx = this.panels.findIndex((p) => p.id === newConfig.id || p.id === this.activePanelId);
    if (idx >= 0) {
      this.panels[idx] = newConfig;
    } else {
      this.panels[0] = newConfig;
    }
  }

  // Backward compatibility getter for fieldBlocks
  get fieldBlocks(): FreeEquipment[] {
    return this.equipment.filter((e) => e.type === 'field_block');
  }

  // Derived calculations
  drcWarnings = $derived<DRCWarning[]>(
    runDesignRuleCheck(this.activePanel, this.devices, this.wires)
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

  selectedEquipment = $derived<FreeEquipment | undefined>(
    (this.selectedType === 'equipment' || this.selectedType === 'field_block')
      ? this.equipment.find((e) => e.id === this.selectedId)
      : undefined
  );

  selectedFieldBlock = $derived<FreeEquipment | undefined>(
    this.selectedEquipment?.type === 'field_block' ? this.selectedEquipment : undefined
  );

  selectedPanel = $derived<PanelConfig | undefined>(
    this.selectedType === 'panel' ? this.panels.find((p) => p.id === this.selectedId) : undefined
  );

  constructor() {
    this.initFromLocalStorage();
  }

  private saveHistory() {
    const snap: HistoryState = {
      panels: JSON.parse(JSON.stringify(this.panels)),
      activePanelId: this.activePanelId,
      devices: JSON.parse(JSON.stringify(this.devices)),
      wires: JSON.parse(JSON.stringify(this.wires)),
      busbars: JSON.parse(JSON.stringify(this.busbars)),
      equipment: JSON.parse(JSON.stringify(this.equipment))
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
        panels: this.panels,
        activePanelId: this.activePanelId,
        config: this.activePanel, // legacy fallback
        devices: this.devices,
        wires: this.wires,
        busbars: this.busbars,
        equipment: this.equipment,
        fieldBlocks: this.fieldBlocks // legacy fallback
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

        // Restore Panels
        if (Array.isArray(parsed.panels) && parsed.panels.length > 0) {
          this.panels = parsed.panels.map((p: any, idx: number) => ({
            id: p.id || `panel-${idx + 1}`,
            name: p.name || `Panel ${idx + 1}`,
            x: typeof p.x === 'number' ? p.x : 60 + idx * 700,
            y: typeof p.y === 'number' ? p.y : 120,
            rows: p.rows || 2,
            slotsPerRow: p.slotsPerRow || 12,
            railSpacing: p.railSpacing || 230,
            wireStandard: p.wireStandard || 'PEC',
            hasGroundBar: p.hasGroundBar ?? true,
            hasNeutralBar: p.hasNeutralBar ?? true,
            groundBarSlots: p.groundBarSlots || p.slotsPerRow || 12,
            neutralBarSlots: p.neutralBarSlots || p.slotsPerRow || 12
          }));
          this.activePanelId = parsed.activePanelId || this.panels[0].id;
        } else if (parsed.config) {
          // Migration from single-panel config
          this.panels = [
            {
              id: 'panel-1',
              name: parsed.config.name || 'Residential Distribution Board',
              x: 60,
              y: 120,
              rows: parsed.config.rows || 2,
              slotsPerRow: parsed.config.slotsPerRow || 12,
              railSpacing: parsed.config.railSpacing || 230,
              wireStandard: parsed.config.wireStandard || 'PEC',
              hasGroundBar: parsed.config.hasGroundBar ?? true,
              hasNeutralBar: parsed.config.hasNeutralBar ?? true,
              groundBarSlots: parsed.config.groundBarSlots || 12,
              neutralBarSlots: parsed.config.neutralBarSlots || 12
            }
          ];
          this.activePanelId = 'panel-1';
        }

        // Restore Equipment (migrating legacy fieldBlocks if present)
        if (Array.isArray(parsed.equipment)) {
          this.equipment = parsed.equipment;
        } else if (Array.isArray(parsed.fieldBlocks)) {
          this.equipment = parsed.fieldBlocks.map((fb: any) => ({
            ...fb,
            type: 'field_block' as FreeEquipmentType
          }));
        }

        if (Array.isArray(parsed.devices)) {
          this.devices = parsed.devices.map((d: any) => ({
            ...d,
            panelId: d.panelId || this.panels[0].id
          }));
        }
        if (Array.isArray(parsed.wires)) this.wires = parsed.wires;
        if (Array.isArray(parsed.busbars)) {
          this.busbars = parsed.busbars.map((b: any) => ({
            ...b,
            panelId: b.panelId || this.panels[0].id
          }));
        }
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
      panels: this.panels,
      activePanelId: this.activePanelId,
      devices: this.devices,
      wires: this.wires,
      busbars: this.busbars,
      equipment: this.equipment
    };
    this.redoStack.push(JSON.stringify(currentState));

    const prevRaw = this.undoStack.pop();
    if (!prevRaw) return;
    const prev: HistoryState = JSON.parse(prevRaw);
    this.panels = prev.panels || this.panels;
    this.activePanelId = prev.activePanelId || this.panels[0]?.id || 'panel-1';
    this.devices = prev.devices;
    this.wires = prev.wires;
    this.busbars = prev.busbars;
    this.equipment = prev.equipment || [];
    this.saveToLocalStorage();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const nextRaw = this.redoStack.pop();
    if (!nextRaw) return;

    const currentState: HistoryState = {
      panels: this.panels,
      activePanelId: this.activePanelId,
      devices: this.devices,
      wires: this.wires,
      busbars: this.busbars,
      equipment: this.equipment
    };
    this.undoStack.push(JSON.stringify(currentState));

    const next: HistoryState = JSON.parse(nextRaw);
    this.panels = next.panels || this.panels;
    this.activePanelId = next.activePanelId || this.panels[0]?.id || 'panel-1';
    this.devices = next.devices;
    this.wires = next.wires;
    this.busbars = next.busbars;
    this.equipment = next.equipment || [];
    this.saveToLocalStorage();
  }

  // Selection
  select(type: 'device' | 'wire' | 'busbar' | 'field_block' | 'equipment' | 'panel' | null, id: string | null) {
    this.selectedType = type;
    this.selectedId = id;
    if (type === 'panel' && id) {
      this.activePanelId = id;
    }
  }

  clearSelection() {
    this.selectedType = null;
    this.selectedId = null;
  }

  // Multi-Panel Management
  addPanel(name?: string, rows = 2, slotsPerRow = 12): PanelConfig {
    this.saveHistory();
    const id = `panel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const count = this.panels.length;
    const assignedName = name || (count === 1 ? 'Sub-Panel 1' : `Distribution Panel ${count + 1}`);

    // Position next to the right of existing panels
    let maxX = 60;
    for (const p of this.panels) {
      const panelWidth = p.slotsPerRow * 44 + 180;
      maxX = Math.max(maxX, p.x + panelWidth);
    }

    const newPanel: PanelConfig = {
      id,
      name: assignedName,
      x: maxX + 60,
      y: 120,
      rows,
      slotsPerRow,
      railSpacing: 230,
      wireStandard: this.activePanel.wireStandard || 'PEC',
      hasGroundBar: true,
      hasNeutralBar: true,
      groundBarSlots: slotsPerRow,
      neutralBarSlots: slotsPerRow
    };

    this.panels.push(newPanel);
    this.activePanelId = id;
    this.select('panel', id);
    this.saveToLocalStorage();
    return newPanel;
  }

  updatePanel(id: string, updates: Partial<PanelConfig>) {
    const p = this.panels.find((panel) => panel.id === id);
    if (!p) return;
    this.saveHistory();
    Object.assign(p, updates);
    this.saveToLocalStorage();
  }

  removePanel(id: string) {
    if (this.panels.length <= 1) {
      alert('Cannot delete the only breaker panel. At least one panel is required.');
      return;
    }
    this.saveHistory();
    this.panels = this.panels.filter((p) => p.id !== id);

    // Delete devices and busbars on this panel
    const removedDeviceIds = new Set(this.devices.filter((d) => d.panelId === id).map((d) => d.id));
    this.devices = this.devices.filter((d) => d.panelId !== id);
    this.busbars = this.busbars.filter((b) => b.panelId !== id);

    // Remove wires connected to removed devices or removed panel busbars
    this.wires = this.wires.filter(
      (w) =>
        !removedDeviceIds.has(w.sourceDeviceId) &&
        !removedDeviceIds.has(w.targetDeviceId) &&
        !w.sourceDeviceId.includes(id) &&
        !w.targetDeviceId.includes(id)
    );

    if (this.activePanelId === id) {
      this.activePanelId = this.panels[0].id;
    }
    if (this.selectedId === id) {
      this.clearSelection();
    }
    this.saveToLocalStorage();
  }

  movePanel(id: string, x: number, y: number) {
    const p = this.panels.find((panel) => panel.id === id);
    if (!p) return;
    const nextX = Math.round(x / 5) * 5;
    const nextY = Math.round(y / 5) * 5;
    if (p.x !== nextX) p.x = nextX;
    if (p.y !== nextY) p.y = nextY;
  }

  setActivePanel(id: string) {
    if (this.panels.some((p) => p.id === id)) {
      this.activePanelId = id;
    }
  }

  getPanelForDevice(deviceId: string): PanelConfig {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (dev?.panelId) {
      const p = this.panels.find((panel) => panel.id === dev.panelId);
      if (p) return p;
    }
    return this.activePanel;
  }

  // Free-Place Equipment Management
  // (Solar Panel, Battery, MCCB, Hybrid Inverter, Offgrid Inverter, Field Block)
  addEquipment(type: FreeEquipmentType, x?: number, y?: number, custom?: Partial<FreeEquipment>): FreeEquipment {
    this.saveHistory();
    const id = `eq_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const count = this.equipment.filter((e) => e.type === type).length;

    // Smart default coordinates based on equipment type
    const defaultY = y !== undefined ? y : 90 + (count % 3) * 170;
    let defaultX = x !== undefined ? x : 750;

    let eqDefaults: Partial<FreeEquipment> = {};

    switch (type) {
      case 'solar_panel':
        eqDefaults = {
          label: count === 0 ? 'Solar Array 1' : `Solar String ${count + 1}`,
          description: '550W Monocrystalline',
          powerWatts: 550,
          voltage: 41.5,
          current: 13.25,
          width: 120,
          height: 150,
          terminalPosition: 'top'
        };
        break;

      case 'battery':
        eqDefaults = {
          label: count === 0 ? 'Battery Bank 5.12kWh' : `Battery Pack ${count + 1}`,
          description: '51.2V 100Ah LiFePO4',
          batteryVoltage: 51.2,
          capacityAh: 100,
          whCalculated: 5120,
          chemistry: 'LiFePO4',
          width: 140,
          height: 110,
          terminalPosition: 'top'
        };
        break;

      case 'mccb':
        eqDefaults = {
          label: count === 0 ? 'Main MCCB 160A' : `Feeder MCCB ${count + 1}`,
          description: '160A 2-Pole 36kA',
          ratedAmps: 160,
          poles: 2,
          breakingCapacityKa: 36,
          width: 100,
          height: 160,
          terminalPosition: 'top'
        };
        break;

      case 'hybrid_inverter':
        eqDefaults = {
          label: count === 0 ? 'Hybrid Inverter 8kW' : `Inverter ${count + 1}`,
          description: '8kW 48V Dual MPPT',
          capacityKw: 8,
          inverterType: 'hybrid',
          systemVoltage: 48,
          width: 190,
          height: 220,
          terminalPosition: 'bottom'
        };
        break;

      case 'offgrid_inverter':
        eqDefaults = {
          label: count === 0 ? 'Off-Grid Inverter 5kW' : `Offgrid Inverter ${count + 1}`,
          description: '5kW 48V Pure Sine Wave',
          capacityKw: 5,
          inverterType: 'offgrid',
          systemVoltage: 48,
          width: 170,
          height: 200,
          terminalPosition: 'bottom'
        };
        break;

      case 'field_block':
      default:
        eqDefaults = {
          label: count === 0 ? 'To Airconditioner' : `Field Circuit ${count + 1}`,
          description: '230V 2-Wire',
          width: 88,
          height: 76,
          terminalPosition: 'top'
        };
        break;
    }

    const newEq: FreeEquipment = {
      id,
      type,
      x: defaultX,
      y: defaultY,
      label: eqDefaults.label || 'Equipment',
      ...eqDefaults,
      ...custom
    };

    // Calculate Wh if battery
    if (newEq.type === 'battery' && newEq.batteryVoltage && newEq.capacityAh) {
      newEq.whCalculated = Math.round(newEq.batteryVoltage * newEq.capacityAh);
    }

    this.equipment.push(newEq);
    this.select('equipment', newEq.id);
    this.saveToLocalStorage();
    return newEq;
  }

  updateEquipment(id: string, updates: Partial<FreeEquipment>) {
    const eq = this.equipment.find((e) => e.id === id);
    if (!eq) return;

    // Auto-calculate Battery Wh
    if (updates.batteryVoltage !== undefined || updates.capacityAh !== undefined) {
      const v = updates.batteryVoltage !== undefined ? updates.batteryVoltage : (eq.batteryVoltage || 0);
      const ah = updates.capacityAh !== undefined ? updates.capacityAh : (eq.capacityAh || 0);
      updates.whCalculated = Math.round(v * ah);
    }

    Object.assign(eq, updates);
    this.saveToLocalStorage();
  }

  removeEquipment(id: string) {
    this.saveHistory();
    this.equipment = this.equipment.filter((e) => e.id !== id);
    this.wires = this.wires.filter(
      (w) => w.sourceDeviceId !== id && w.targetDeviceId !== id
    );
    if (this.selectedId === id) {
      this.clearSelection();
    }
    this.saveToLocalStorage();
  }

  removeFieldBlock(id: string) {
    this.removeEquipment(id);
  }

  updateFieldBlock(id: string, updates: Partial<FreeEquipment>) {
    this.updateEquipment(id, updates);
  }

  // Quick helper methods for each equipment
  addSolarPanel(x?: number, y?: number) {
    return this.addEquipment('solar_panel', x, y);
  }

  addBattery(x?: number, y?: number) {
    return this.addEquipment('battery', x, y);
  }

  addMCCB(x?: number, y?: number) {
    return this.addEquipment('mccb', x, y);
  }

  addHybridInverter(x?: number, y?: number) {
    return this.addEquipment('hybrid_inverter', x, y);
  }

  addOffgridInverter(x?: number, y?: number) {
    return this.addEquipment('offgrid_inverter', x, y);
  }

  addFieldBlock(label?: string, x?: number, y?: number): FreeEquipment {
    return this.addEquipment('field_block', x, y, label ? { label } : undefined);
  }

  // Device Placement on DIN Rails (supporting multi-panel)
  canPlaceDevice(
    railIndex: number,
    slotIndex: number,
    widthModules: number,
    excludeDeviceId?: string,
    panelId?: string
  ): boolean {
    const targetPanelId = panelId || this.activePanelId;
    const panel = this.panels.find((p) => p.id === targetPanelId) || this.activePanel;

    if (slotIndex < 0 || slotIndex + widthModules > panel.slotsPerRow) return false;
    // Check collisions with other devices on the same rail of the same panel
    return !this.devices.some((d) => {
      if (d.id === excludeDeviceId) return false;
      const dPanelId = d.panelId || this.panels[0].id;
      if (dPanelId !== targetPanelId) return false;
      if (d.railIndex !== railIndex) return false;
      const dEnd = d.slotIndex + d.widthModules;
      const targetEnd = slotIndex + widthModules;
      return Math.max(d.slotIndex, slotIndex) < Math.min(dEnd, targetEnd);
    });
  }

  placeDevice(typeId: string, railIndex: number, slotIndex: number, panelId?: string): PlacedDevice | null {
    const def = getDeviceDef(typeId);
    if (!def) return null;

    const targetPanelId = panelId || this.activePanelId;
    if (!this.canPlaceDevice(railIndex, slotIndex, def.widthModules, undefined, targetPanelId)) {
      return null;
    }

    this.saveHistory();
    const newDevice: PlacedDevice = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      typeId,
      panelId: targetPanelId,
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

  moveDevice(deviceId: string, railIndex: number, newSlotIndex: number, newPanelId?: string): boolean {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (!dev) return false;

    const targetPanelId = newPanelId || dev.panelId || this.activePanelId;
    if (!this.canPlaceDevice(railIndex, newSlotIndex, dev.widthModules, deviceId, targetPanelId)) {
      return false;
    }

    this.saveHistory();
    dev.panelId = targetPanelId;
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
    const colorDef = getWireColor(this.activeWireRole, this.activePanel.wireStandard);

    const newWire: WireConnection = {
      id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceDeviceId,
      sourceTerminalId,
      targetDeviceId,
      targetTerminalId,
      role: this.activeWireRole,
      color: colorDef.hex,
      gaugeMetric: this.activeWireGauge,
      standard: this.activePanel.wireStandard,
      routingMode: this.activeWireRouting,
      waypoints: []
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

  // Waypoints / Node Routing Management
  addWireWaypoint(wireId: string, point: WirePoint, index?: number) {
    const wire = this.wires.find((w) => w.id === wireId);
    if (!wire) return;
    this.saveHistory();
    if (!wire.waypoints) wire.waypoints = [];
    const roundedPoint = { x: Math.round(point.x), y: Math.round(point.y) };
    if (typeof index === 'number' && index >= 0 && index <= wire.waypoints.length) {
      wire.waypoints.splice(index, 0, roundedPoint);
    } else {
      wire.waypoints.push(roundedPoint);
    }
    this.saveToLocalStorage();
  }

  updateWireWaypoint(wireId: string, nodeIndex: number, newPoint: WirePoint) {
    const wire = this.wires.find((w) => w.id === wireId);
    if (!wire || !wire.waypoints || !wire.waypoints[nodeIndex]) return;
    const nextX = Math.round(newPoint.x);
    const nextY = Math.round(newPoint.y);
    if (wire.waypoints[nodeIndex].x !== nextX) wire.waypoints[nodeIndex].x = nextX;
    if (wire.waypoints[nodeIndex].y !== nextY) wire.waypoints[nodeIndex].y = nextY;
  }

  removeWireWaypoint(wireId: string, nodeIndex: number) {
    const wire = this.wires.find((w) => w.id === wireId);
    if (!wire || !wire.waypoints) return;
    this.saveHistory();
    wire.waypoints.splice(nodeIndex, 1);
    this.saveToLocalStorage();
  }

  clearWireWaypoints(wireId: string) {
    const wire = this.wires.find((w) => w.id === wireId);
    if (!wire) return;
    this.saveHistory();
    wire.waypoints = [];
    this.saveToLocalStorage();
  }

  // Comb Busbar Management
  addBusbar(
    railIndex: number,
    position: TerminalPosition,
    busbarType: '1P' | '1P+N' | '2P' | '3P',
    startSlot: number,
    slotSpan: number,
    panelId?: string
  ) {
    this.saveHistory();
    const newBusbar: CombBusbar = {
      id: `busbar_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      panelId: panelId || this.activePanelId,
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

  // Presets & Project Setup (applies to activePanel)
  applyPreset(presetName: string) {
    this.saveHistory();
    switch (presetName) {
      case '1-Row 12M':
        this.activePanel.rows = 1;
        this.activePanel.slotsPerRow = 12;
        break;
      case '2-Row 24M':
        this.activePanel.rows = 2;
        this.activePanel.slotsPerRow = 12;
        break;
      case '3-Row 36M':
        this.activePanel.rows = 3;
        this.activePanel.slotsPerRow = 12;
        break;
      case '2-Row 36M':
        this.activePanel.rows = 2;
        this.activePanel.slotsPerRow = 18;
        break;
      case '4-Row 48M':
        this.activePanel.rows = 4;
        this.activePanel.slotsPerRow = 12;
        break;
    }
    this.saveToLocalStorage();
  }

  setRailSpacing(spacing: number) {
    this.saveHistory();
    this.activePanel.railSpacing = Math.max(170, Math.min(450, Math.round(spacing)));
    this.saveToLocalStorage();
  }

  adjustRailSpacing(delta: number) {
    const current = this.activePanel.railSpacing || 230;
    this.setRailSpacing(current + delta);
  }

  clearProject() {
    this.saveHistory();
    this.devices = [];
    this.wires = [];
    this.busbars = [];
    this.equipment = [];
    this.clearSelection();
    this.saveToLocalStorage();
  }

  loadSampleProject() {
    this.panels = [
      {
        id: 'panel-1',
        name: 'Main Distribution Panel',
        x: 60,
        y: 120,
        rows: 2,
        slotsPerRow: 12,
        railSpacing: 230,
        wireStandard: 'PEC',
        hasGroundBar: true,
        hasNeutralBar: true,
        groundBarSlots: 12,
        neutralBarSlots: 12
      }
    ];
    this.activePanelId = 'panel-1';

    const d1: PlacedDevice = {
      id: 'dev_incomer',
      typeId: 'isolator-2p-63a',
      panelId: 'panel-1',
      railIndex: 0,
      slotIndex: 0,
      widthModules: 2,
      customLabel: 'MAIN',
      circuitDescription: '63A 230V Main Incomer',
      ratedAmps: 63
    };

    const d2: PlacedDevice = {
      id: 'dev_spd',
      typeId: 'spd-type2-2p',
      panelId: 'panel-1',
      railIndex: 0,
      slotIndex: 2,
      widthModules: 2,
      customLabel: 'SPD',
      circuitDescription: 'Surge Protection Device'
    };

    const d3: PlacedDevice = {
      id: 'dev_rcd',
      typeId: 'rcd-2p-40a',
      panelId: 'panel-1',
      railIndex: 0,
      slotIndex: 5,
      widthModules: 2,
      customLabel: 'RCD-1',
      circuitDescription: '40A 30mA Ground Fault Protection',
      ratedAmps: 40
    };

    const d4: PlacedDevice = {
      id: 'dev_mcb1',
      typeId: 'mcb-1p-16a',
      panelId: 'panel-1',
      railIndex: 1,
      slotIndex: 0,
      widthModules: 1,
      customLabel: 'C1',
      circuitDescription: 'Living Room Lights',
      ratedAmps: 16,
      curve: 'C'
    };

    const d5: PlacedDevice = {
      id: 'dev_mcb2',
      typeId: 'mcb-1p-20a',
      panelId: 'panel-1',
      railIndex: 1,
      slotIndex: 1,
      widthModules: 1,
      customLabel: 'C2',
      circuitDescription: 'Kitchen Outlets',
      ratedAmps: 20,
      curve: 'C'
    };

    this.devices = [d1, d2, d3, d4, d5];

    // Detached Field Block
    this.equipment = [
      {
        id: 'fb_demo_1',
        type: 'field_block',
        label: 'To Airconditioner',
        description: '230V 1.5HP Inverter',
        x: 680,
        y: 120,
        width: 88,
        height: 76,
        terminalPosition: 'top'
      }
    ];

    // Sample wires
    this.wires = [
      {
        id: 'w1',
        sourceDeviceId: 'dev_incomer',
        sourceTerminalId: 'L_OUT',
        targetDeviceId: 'dev_spd',
        targetTerminalId: 'L1',
        role: 'line1',
        color: '#0f172a',
        gaugeMetric: 10,
        standard: 'PEC',
        routingMode: 'orthogonal',
        waypoints: []
      },
      {
        id: 'w2',
        sourceDeviceId: 'dev_incomer',
        sourceTerminalId: 'N_OUT',
        targetDeviceId: 'dev_spd',
        targetTerminalId: 'L2',
        role: 'line2',
        color: '#dc2626',
        gaugeMetric: 10,
        standard: 'PEC',
        routingMode: 'orthogonal',
        waypoints: []
      },
      {
        id: 'w3',
        sourceDeviceId: 'PE_BAR_panel-1',
        sourceTerminalId: 'G_1',
        targetDeviceId: 'dev_spd',
        targetTerminalId: 'PE',
        role: 'earth',
        color: '#16a34a',
        gaugeMetric: 10,
        standard: 'PEC',
        routingMode: 'curved',
        waypoints: []
      },
      {
        id: 'w4',
        sourceDeviceId: 'dev_spd',
        sourceTerminalId: 'L1',
        targetDeviceId: 'dev_rcd',
        targetTerminalId: 'L_IN',
        role: 'line1',
        color: '#0f172a',
        gaugeMetric: 10,
        standard: 'PEC',
        routingMode: 'orthogonal',
        waypoints: []
      }
    ];

    this.busbars = [];
    this.saveToLocalStorage();
  }

  // Export / Import
  exportJSON(): string {
    return JSON.stringify(
      {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        panels: this.panels,
        activePanelId: this.activePanelId,
        config: this.activePanel,
        devices: this.devices,
        wires: this.wires,
        busbars: this.busbars,
        equipment: this.equipment
      },
      null,
      2
    );
  }

  importJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (!data) return false;

      this.saveHistory();

      if (Array.isArray(data.panels) && data.panels.length > 0) {
        this.panels = data.panels;
        this.activePanelId = data.activePanelId || this.panels[0].id;
      } else if (data.config) {
        this.panels = [
          {
            ...data.config,
            id: 'panel-1',
            x: data.config.x || 60,
            y: data.config.y || 120
          }
        ];
        this.activePanelId = 'panel-1';
      }

      this.devices = Array.isArray(data.devices)
        ? data.devices.map((d: any) => ({ ...d, panelId: d.panelId || this.panels[0].id }))
        : [];
      this.wires = Array.isArray(data.wires) ? data.wires : [];
      this.busbars = Array.isArray(data.busbars)
        ? data.busbars.map((b: any) => ({ ...b, panelId: b.panelId || this.panels[0].id }))
        : [];

      if (Array.isArray(data.equipment)) {
        this.equipment = data.equipment;
      } else if (Array.isArray(data.fieldBlocks)) {
        this.equipment = data.fieldBlocks.map((fb: any) => ({
          ...fb,
          type: 'field_block' as FreeEquipmentType
        }));
      } else {
        this.equipment = [];
      }

      this.clearSelection();
      this.saveToLocalStorage();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  exportBOMCSV(): string {
    const headers = ['Panel / Location', 'Item Name', 'Type / Model', 'Category', 'Modules / Dimensions', 'Specs / Rating', 'Circuit Description', 'Quantity'];
    const groups = new Map<string, { panel: string; name: string; type: string; category: string; dim: string; specs: string; desc: string; count: number }>();

    // DIN devices
    for (const d of this.devices) {
      const def = getDeviceDef(d.typeId);
      const panel = this.panels.find((p) => p.id === d.panelId) || this.activePanel;
      const key = `${d.panelId}_${d.typeId}_${d.ratedAmps || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          panel: panel.name,
          name: def?.name || d.customLabel,
          type: d.typeId,
          category: def?.category || 'modular_breaker',
          dim: `${d.widthModules} TE (${d.widthModules * 18}mm)`,
          specs: d.ratedAmps ? `${d.curve || ''}${d.ratedAmps}A` : '-',
          desc: d.circuitDescription,
          count: 0
        });
      }
      groups.get(key)!.count += 1;
    }

    // Free Equipment (Solar, Battery, Inverters, MCCB, Field Blocks)
    for (const eq of this.equipment) {
      const key = `eq_${eq.type}_${eq.label}`;
      let specs = '-';
      if (eq.type === 'solar_panel') specs = `${eq.powerWatts || 550}W, ${eq.voltage || 41.5}V, ${eq.current || 13.25}A`;
      else if (eq.type === 'battery') specs = `${eq.batteryVoltage || 51.2}V ${eq.capacityAh || 100}Ah (${((eq.whCalculated || 5120) / 1000).toFixed(2)}kWh)`;
      else if (eq.type === 'mccb') specs = `${eq.ratedAmps || 160}A ${eq.poles || 2}P (${eq.breakingCapacityKa || 36}kA)`;
      else if (eq.type === 'hybrid_inverter') specs = `${eq.capacityKw || 8}kW Hybrid Inverter (${eq.systemVoltage || 48}V)`;
      else if (eq.type === 'offgrid_inverter') specs = `${eq.capacityKw || 5}kW Offgrid Inverter (${eq.systemVoltage || 48}V)`;
      else if (eq.type === 'field_block') specs = '230V 2-Terminal Block';

      if (!groups.has(key)) {
        groups.set(key, {
          panel: 'Freestanding / Off-Rail',
          name: eq.label,
          type: eq.type,
          category: 'system_equipment',
          dim: `${eq.width || 100}x${eq.height || 100}px`,
          specs,
          desc: eq.description || '-',
          count: 0
        });
      }
      groups.get(key)!.count += 1;
    }

    const rows = Array.from(groups.values()).map((g) => [
      `"${g.panel}"`,
      `"${g.name}"`,
      `"${g.type}"`,
      `"${g.category}"`,
      `"${g.dim}"`,
      `"${g.specs}"`,
      `"${g.desc}"`,
      g.count
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  exportWireScheduleCSV(): string {
    const headers = ['Wire ID', 'From Device', 'From Terminal', 'To Device', 'To Terminal', 'Role', 'Gauge (mm²)', 'Color'];
    const rows = this.wires.map((w) => {
      const srcDev = this.devices.find((d) => d.id === w.sourceDeviceId) || this.equipment.find((b) => b.id === w.sourceDeviceId);
      const tgtDev = this.devices.find((d) => d.id === w.targetDeviceId) || this.equipment.find((b) => b.id === w.targetDeviceId);
      const srcName = (srcDev as any)?.label || (srcDev as any)?.customLabel || w.sourceDeviceId;
      const tgtName = (tgtDev as any)?.label || (tgtDev as any)?.customLabel || w.targetDeviceId;
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
