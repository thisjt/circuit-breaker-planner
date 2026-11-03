export type WireStandard = 'PEC' | 'IEC';

export type WireRole = 
  | 'line1' 
  | 'line2' 
  | 'line3' 
  | 'neutral' 
  | 'earth' 
  | 'dc_pos' 
  | 'dc_neg' 
  | 'signal';

export interface WireColorDef {
  name: string;
  role: WireRole;
  hex: string;
  stripeHex?: string; // e.g. yellow stripe for green earth wire
  description: string;
}

export interface WireGaugeDef {
  metric: number; // in mm^2 (e.g. 1.5, 2.5, 4, 6, 10, 16, 25)
  awg: string; // e.g. "14 AWG"
  maxAmps: number; // safe ampacity reference for DRC
  renderWidth: number; // stroke width on canvas
}

export type TerminalPosition = 'top' | 'bottom';

export interface TerminalDef {
  id: string; // unique within component (e.g. "L_IN", "N_IN", "1", "2")
  label: string;
  sublabel?: string;
  position: TerminalPosition;
  slotOffset: number; // horizontal module coordinate from left edge
  yOffset?: number; // custom vertical offset from top of component in px
  type: 'screw' | 'cage' | 'comb_slot';
  defaultRole?: WireRole;
}

export type DeviceCategory = 
  | 'main_switch' 
  | 'mcb' 
  | 'rcd' 
  | 'rcbo' 
  | 'spd' 
  | 'terminal' 
  | 'smart' 
  | 'ats'
  | 'accessory';

export interface DeviceDefinition {
  typeId: string;
  name: string;
  category: DeviceCategory;
  widthModules: number; // in standard 18mm TE
  poles: 1 | 2 | 3 | 4;
  ratedAmps?: number;
  curve?: 'B' | 'C' | 'D';
  breakingCapacityKa?: number; // e.g. 4.5, 6, 10
  residualCurrentMa?: number; // for RCD/RCBO: 30, 100, 300
  colorAccent?: string; // decorative brand/category color
  terminals: TerminalDef[];
  hasTestButton?: boolean;
  hasTripWindow?: boolean;
  description: string;
}

export interface PlacedDevice {
  id: string;
  typeId: string;
  railIndex: number;
  slotIndex: number; // 0 to (slotsPerRail - widthModules)
  widthModules: number;
  customLabel: string; // e.g. "Q1", "Main Incomer"
  circuitDescription: string; // e.g. "Master Bedroom AC"
  ratedAmps?: number;
  curve?: 'B' | 'C' | 'D';
}

export interface WirePoint {
  x: number;
  y: number;
}

export interface WireConnection {
  id: string;
  sourceDeviceId: string; // device id, or "PE_BAR" or "N_BAR"
  sourceTerminalId: string;
  targetDeviceId: string;
  targetTerminalId: string;
  role: WireRole;
  color: string;
  gaugeMetric: number; // mm^2
  standard: WireStandard;
  routingMode?: 'curved' | 'orthogonal';
  customTag?: string;
  waypoints?: WirePoint[]; // intermediate routing nodes / right-angle waypoints
}

export interface CombBusbar {
  id: string;
  railIndex: number;
  position: TerminalPosition; // 'top' | 'bottom'
  busbarType: '1P' | '1P+N' | '2P' | '3P';
  startSlot: number;
  slotSpan: number;
  phaseOrder?: ('L1' | 'L2' | 'L3' | 'N')[];
}

export interface PanelConfig {
  name: string;
  rows: number; // number of DIN rails
  slotsPerRow: number; // number of 18mm modules per rail
  railSpacing?: number; // center-to-center distance between DIN rails in px (default 230)
  wireStandard: WireStandard;
  hasGroundBar: boolean;
  hasNeutralBar: boolean;
  groundBarSlots: number;
  neutralBarSlots: number;
}

export type DRCWarningLevel = 'error' | 'warning' | 'info';

export interface DRCWarning {
  id: string;
  level: DRCWarningLevel;
  title: string;
  message: string;
  relatedDeviceIds?: string[];
  relatedWireIds?: string[];
}

