import type { DeviceDefinition } from './types';

export const DEVICE_CATALOG: DeviceDefinition[] = [
  // MAIN SWITCHES / ISOLATORS
  {
    typeId: 'isolator-2p-63a',
    name: '2-Pole 63A Main Switch',
    category: 'main_switch',
    widthModules: 2,
    poles: 2,
    ratedAmps: 63,
    colorAccent: '#dc2626', // Red toggle
    terminals: [
      { id: 'L_IN', label: '1 (L In)', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: '2 (L Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: 'Double pole main incomer switch disconnector.'
  },
  {
    typeId: 'isolator-2p-100a',
    name: '2-Pole 100A Main Switch',
    category: 'main_switch',
    widthModules: 2,
    poles: 2,
    ratedAmps: 100,
    colorAccent: '#dc2626',
    terminals: [
      { id: 'L_IN', label: '1 (L In)', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: '2 (L Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: 'Heavy-duty 100A double pole main incomer.'
  },
  {
    typeId: 'isolator-4p-63a',
    name: '4-Pole 63A Main Switch',
    category: 'main_switch',
    widthModules: 4,
    poles: 4,
    ratedAmps: 63,
    colorAccent: '#dc2626',
    terminals: [
      { id: 'L1_IN', label: 'L1 In', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'L2_IN', label: 'L2 In', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L3_IN', label: 'L3 In', position: 'top', slotOffset: 2.5, type: 'screw', defaultRole: 'line3' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 3.5, type: 'screw', defaultRole: 'neutral' },
      { id: 'L1_OUT', label: 'L1 Out', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'L2_OUT', label: 'L2 Out', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L3_OUT', label: 'L3 Out', position: 'bottom', slotOffset: 2.5, type: 'screw', defaultRole: 'line3' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 3.5, type: 'screw', defaultRole: 'neutral' }
    ],
    description: '4-Pole 3-Phase + Neutral main incomer switch.'
  },

  // RCDs / RCCBs
  {
    typeId: 'rcd-2p-40a-30ma',
    name: '2-Pole 40A 30mA RCD',
    category: 'rcd',
    widthModules: 2,
    poles: 2,
    ratedAmps: 40,
    residualCurrentMa: 30,
    hasTestButton: true,
    hasTripWindow: true,
    colorAccent: '#2563eb', // Blue toggle/test button
    terminals: [
      { id: 'L_IN', label: '1 (L In)', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: '2 (L Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: 'Residual Current Circuit Breaker (30mA trip for personal protection).'
  },
  {
    typeId: 'rcd-2p-63a-30ma',
    name: '2-Pole 63A 30mA RCD',
    category: 'rcd',
    widthModules: 2,
    poles: 2,
    ratedAmps: 63,
    residualCurrentMa: 30,
    hasTestButton: true,
    hasTripWindow: true,
    colorAccent: '#2563eb',
    terminals: [
      { id: 'L_IN', label: '1 (L In)', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: '2 (L Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: 'High capacity 63A 30mA RCD for multi-circuit branch groups.'
  },

  // RCBOs (Overcurrent + Residual Current Protection)
  {
    typeId: 'rcbo-1p-compact-16a',
    name: '1P+N Compact 16A 30mA RCBO',
    category: 'rcbo',
    widthModules: 1,
    poles: 2,
    ratedAmps: 16,
    curve: 'C',
    residualCurrentMa: 30,
    breakingCapacityKa: 6,
    hasTestButton: true,
    hasTripWindow: true,
    colorAccent: '#059669', // Emerald accent
    terminals: [
      { id: 'L_IN', label: 'L In', position: 'top', slotOffset: 0.28, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' },
      { id: 'L_OUT', label: 'L Out', position: 'bottom', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' }
    ],
    description: 'Slim 1-module RCBO saving space in consumer units.'
  },
  {
    typeId: 'rcbo-1p-compact-20a',
    name: '1P+N Compact 20A 30mA RCBO',
    category: 'rcbo',
    widthModules: 1,
    poles: 2,
    ratedAmps: 20,
    curve: 'C',
    residualCurrentMa: 30,
    breakingCapacityKa: 6,
    hasTestButton: true,
    hasTripWindow: true,
    colorAccent: '#059669',
    terminals: [
      { id: 'L_IN', label: 'L In', position: 'top', slotOffset: 0.28, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' },
      { id: 'L_OUT', label: 'L Out', position: 'bottom', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' }
    ],
    description: 'Slim 20A RCBO suitable for 20A branch outlets.'
  },
  {
    typeId: 'rcbo-2p-32a-30ma',
    name: '2-Pole 2-Wide 32A 30mA RCBO',
    category: 'rcbo',
    widthModules: 2,
    poles: 2,
    ratedAmps: 32,
    curve: 'C',
    residualCurrentMa: 30,
    breakingCapacityKa: 6,
    hasTestButton: true,
    hasTripWindow: true,
    colorAccent: '#059669',
    terminals: [
      { id: 'L_IN', label: 'L In', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: 'N In', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: 'L Out', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: 'N Out', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: 'Standard 2-wide 32A RCBO for heavy inductive loads (water heaters, ACs).'
  },

  // MCBs (Miniature Circuit Breakers)
  {
    typeId: 'mcb-1p-16a',
    name: '1-Pole 16A MCB',
    category: 'mcb',
    widthModules: 1,
    poles: 1,
    ratedAmps: 16,
    curve: 'C',
    breakingCapacityKa: 6,
    colorAccent: '#334155',
    terminals: [
      { id: 'IN', label: '1 (In)', position: 'top', slotOffset: 0.5, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'OUT', label: '2 (Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' }
    ],
    description: 'Standard 16A lighting / general circuit breaker.'
  },
  {
    typeId: 'mcb-1p-20a',
    name: '1-Pole 20A MCB',
    category: 'mcb',
    widthModules: 1,
    poles: 1,
    ratedAmps: 20,
    curve: 'C',
    breakingCapacityKa: 6,
    colorAccent: '#334155',
    terminals: [
      { id: 'IN', label: '1 (In)', position: 'top', slotOffset: 0.5, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'OUT', label: '2 (Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' }
    ],
    description: 'Standard 20A socket outlet branch breaker.'
  },
  {
    typeId: 'mcb-1p-32a',
    name: '1-Pole 32A MCB',
    category: 'mcb',
    widthModules: 1,
    poles: 1,
    ratedAmps: 32,
    curve: 'C',
    breakingCapacityKa: 6,
    colorAccent: '#334155',
    terminals: [
      { id: 'IN', label: '1 (In)', position: 'top', slotOffset: 0.5, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'OUT', label: '2 (Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' }
    ],
    description: '32A high capacity branch circuit breaker.'
  },
  {
    typeId: 'mcb-2p-20a',
    name: '2-Pole 20A MCB',
    category: 'mcb',
    widthModules: 2,
    poles: 2,
    ratedAmps: 20,
    curve: 'C',
    breakingCapacityKa: 6,
    colorAccent: '#334155',
    terminals: [
      { id: 'L1_IN', label: '1 (L1 In)', position: 'top', slotOffset: 0.5, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'L2_IN', label: '3 (L2 In)', position: 'top', slotOffset: 1.5, type: 'comb_slot', defaultRole: 'line2' },
      { id: 'L1_OUT', label: '2 (L1 Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'L2_OUT', label: '4 (L2 Out)', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: '2-Pole 20A breaker for 230V 2-wire delta systems or 2-phase equipment.'
  },
  {
    typeId: 'mcb-2p-32a',
    name: '2-Pole 32A MCB',
    category: 'mcb',
    widthModules: 2,
    poles: 2,
    ratedAmps: 32,
    curve: 'C',
    breakingCapacityKa: 6,
    colorAccent: '#334155',
    terminals: [
      { id: 'L1_IN', label: '1 (L1 In)', position: 'top', slotOffset: 0.5, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'L2_IN', label: '3 (L2 In)', position: 'top', slotOffset: 1.5, type: 'comb_slot', defaultRole: 'line2' },
      { id: 'L1_OUT', label: '2 (L1 Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'L2_OUT', label: '4 (L2 Out)', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: '2-Pole 32A breaker for air conditioners and water heaters.'
  },
  {
    typeId: 'mcb-3p-32a',
    name: '3-Pole 32A MCB',
    category: 'mcb',
    widthModules: 3,
    poles: 3,
    ratedAmps: 32,
    curve: 'C',
    breakingCapacityKa: 6,
    colorAccent: '#334155',
    terminals: [
      { id: 'L1_IN', label: '1', position: 'top', slotOffset: 0.5, type: 'comb_slot', defaultRole: 'line1' },
      { id: 'L2_IN', label: '3', position: 'top', slotOffset: 1.5, type: 'comb_slot', defaultRole: 'line2' },
      { id: 'L3_IN', label: '5', position: 'top', slotOffset: 2.5, type: 'comb_slot', defaultRole: 'line3' },
      { id: 'L1_OUT', label: '2', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'L2_OUT', label: '4', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L3_OUT', label: '6', position: 'bottom', slotOffset: 2.5, type: 'screw', defaultRole: 'line3' }
    ],
    description: '3-Phase 32A breaker for motors and commercial equipment.'
  },

  // SURGE PROTECTION DEVICES (SPD)
  {
    typeId: 'spd-2p-t2',
    name: '2-Pole Type 2 SPD',
    category: 'spd',
    widthModules: 2,
    poles: 2,
    colorAccent: '#0284c7', // Sky blue
    hasTripWindow: true,
    terminals: [
      { id: 'L', label: 'L / L1', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N', label: 'N / L2', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'PE', label: 'PE (Ground)', position: 'bottom', slotOffset: 1.0, type: 'screw', defaultRole: 'earth' }
    ],
    description: 'Type 2 Surge Arrester (20kA/40kA) protecting against transient overvoltages.'
  },

  // TERMINAL & DISTRIBUTION BLOCKS
  {
    typeId: 'terminal-dist-1in4out',
    name: '1-In 4-Out Terminal Block',
    category: 'terminal',
    widthModules: 1,
    poles: 1,
    colorAccent: '#475569',
    terminals: [
      { id: 'IN', label: 'IN (16mm²)', position: 'top', slotOffset: 0.5, type: 'screw' },
      { id: 'OUT_1', label: 'OUT 1', position: 'bottom', slotOffset: 0.22, type: 'screw' },
      { id: 'OUT_2', label: 'OUT 2', position: 'bottom', slotOffset: 0.5, type: 'screw' },
      { id: 'OUT_3', label: 'OUT 3', position: 'bottom', slotOffset: 0.78, type: 'screw' }
    ],
    description: 'Distribution block splitting one main feeder into multiple branch feeds.'
  },
  {
    typeId: 'terminal-passthrough-1m',
    name: '1-Module Feed-through Block',
    category: 'terminal',
    widthModules: 1,
    poles: 1,
    colorAccent: '#64748b',
    terminals: [
      { id: 'TOP', label: 'Top In/Out', position: 'top', slotOffset: 0.5, type: 'cage' },
      { id: 'BOTTOM', label: 'Bottom In/Out', position: 'bottom', slotOffset: 0.5, type: 'cage' }
    ],
    description: 'High current terminal block for passing conductors across rows.'
  },

  // SMART & AUXILIARY
  {
    typeId: 'shelly-smart-relay-1m',
    name: 'Smart DIN Relay (Shelly)',
    category: 'smart',
    widthModules: 1,
    poles: 1,
    colorAccent: '#0ea5e9',
    terminals: [
      { id: 'L', label: 'L (Line)', position: 'top', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N', label: 'N (Neutral)', position: 'top', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' },
      { id: 'SW', label: 'SW (Switch)', position: 'bottom', slotOffset: 0.28, type: 'screw', defaultRole: 'signal' },
      { id: 'OUT', label: 'O (Output)', position: 'bottom', slotOffset: 0.72, type: 'screw', defaultRole: 'line1' }
    ],
    description: 'Wi-Fi/LAN smart dry contact DIN-mounted relay.'
  },
  {
    typeId: 'energy-meter-2p',
    name: 'Digital Energy Meter 2P (2-Module)',
    category: 'smart',
    widthModules: 2,
    poles: 2,
    ratedAmps: 63,
    colorAccent: '#10b981', // Emerald green
    terminals: [
      { id: 'L_IN', label: '1 (L / L1 In)', position: 'top', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: '3 (N / L2 In)', position: 'top', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: '2 (L / L1 Out)', position: 'bottom', slotOffset: 0.5, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: '4 (N / L2 Pass)', position: 'bottom', slotOffset: 1.5, type: 'screw', defaultRole: 'line2' }
    ],
    description: '2-Module (36mm) 63A Dual-Line Digital Energy Meter with backlit LCD. Features direct Line 1 load metering and integrated Neutral / Line 2 solid passthrough, ideal for 230V Line-to-Line (PH 2-wire Delta) and Line-to-Neutral systems.'
  },
  {
    typeId: 'energy-meter-2p-1m',
    name: 'Digital Energy Meter 2P (1-Module Compact)',
    category: 'smart',
    widthModules: 1,
    poles: 2,
    ratedAmps: 63,
    colorAccent: '#10b981',
    terminals: [
      { id: 'L_IN', label: '1 (L In)', position: 'top', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: '3 (L2/N)', position: 'top', slotOffset: 0.72, type: 'screw', defaultRole: 'line2' },
      { id: 'L_OUT', label: '2 (L Out)', position: 'bottom', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: '4 (Pass)', position: 'bottom', slotOffset: 0.72, type: 'screw', defaultRole: 'line2' }
    ],
    description: '1-Module (18mm) ultra-compact 2-Pole 63A Digital Energy Meter with LCD. 2-In / 2-Out with integrated Neutral / Line 2 passthrough (Sinotimer / Tomzn DDS6619 / DDS238 style).'
  },
  {
    typeId: 'energy-meter-1m',
    name: 'Digital Energy Meter 1P (Compact)',
    category: 'smart',
    widthModules: 1,
    poles: 1,
    ratedAmps: 45,
    colorAccent: '#10b981',
    terminals: [
      { id: 'L_IN', label: '1 (L In)', position: 'top', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N_IN', label: '3 (N In)', position: 'top', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' },
      { id: 'L_OUT', label: '2 (L Out)', position: 'bottom', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: 'N_OUT', label: '4 (N Pass)', position: 'bottom', slotOffset: 0.72, type: 'screw', defaultRole: 'neutral' }
    ],
    description: '1-Module (18mm) compact direct reading single-phase kWh energy monitor with Neutral passthrough.'
  },

  // TRANSFER SWITCHES (ATS & MTS)
  {
    typeId: 'mts-2p-63a',
    name: 'Manual Transfer Switch (MTS) 63A',
    category: 'ats',
    widthModules: 2,
    poles: 2,
    ratedAmps: 63,
    colorAccent: '#2563eb', // Blue logo / branding accent
    terminals: [
      // Top Terminals: Load Output
      { id: '1', label: '1 (Load L)', position: 'top', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: '5', label: '5 (Load N)', position: 'top', slotOffset: 1.28, type: 'screw', defaultRole: 'line2' },

      // Bottom Terminals: Dual Power Sources (Grid on 2 & 6; Generator on 4 & 8)
      { id: '2', label: '2 (Grid L)', position: 'bottom', slotOffset: 0.28, type: 'screw', defaultRole: 'line1' },
      { id: '4', label: '4 (Gen L)', position: 'bottom', slotOffset: 0.72, type: 'screw', defaultRole: 'line1' },
      { id: '6', label: '6 (Grid N)', position: 'bottom', slotOffset: 1.28, type: 'screw', defaultRole: 'line2' },
      { id: '8', label: '8 (Gen N)', position: 'bottom', slotOffset: 1.72, type: 'screw', defaultRole: 'line2' }
    ],
    description: '2-Module 63A 400V 3-Position (I-0-II) Manual Transfer Switch (Taxnele TX219G). Toggles load between Utility Grid (Terminals 2 & 6) and Generator/Inverter (Terminals 4 & 8).'
  },
  {
    typeId: 'ats-2p-100a',
    name: 'Automatic Transfer Switch (ATS) 100A',
    category: 'ats',
    widthModules: 6,
    poles: 2,
    ratedAmps: 100,
    colorAccent: '#dc2626',
    terminals: [
      // Top 2 terminals: Main Power In (City / Normal Power A)
      { id: 'MAIN_L', label: 'Main L (A)', position: 'top', slotOffset: 0.5, yOffset: 14, type: 'screw', defaultRole: 'line1' },
      { id: 'MAIN_N', label: 'Main N (A)', position: 'top', slotOffset: 1.5, yOffset: 14, type: 'screw', defaultRole: 'neutral' },

      // Above of bottom 2 terminals: Standby Power In (Generator / Reverse Power B)
      { id: 'STANDBY_L', label: 'Standby L', position: 'bottom', slotOffset: 0.5, yOffset: 114, type: 'screw', defaultRole: 'line1' },
      { id: 'STANDBY_N', label: 'Standby N', position: 'bottom', slotOffset: 1.5, yOffset: 114, type: 'screw', defaultRole: 'neutral' },

      // Below of bottom 2 terminals: ATS Output (Load Feed)
      { id: 'OUT_L', label: 'ATS Out L', position: 'bottom', slotOffset: 0.5, yOffset: 146, type: 'screw', defaultRole: 'line1' },
      { id: 'OUT_N', label: 'ATS Out N', position: 'bottom', slotOffset: 1.5, yOffset: 146, type: 'screw', defaultRole: 'neutral' },

      // Auxiliary / Control Signal Terminals (Right side green block)
      { id: 'SIG_AR', label: 'AR', position: 'top', slotOffset: 4.55, yOffset: 12, type: 'screw', defaultRole: 'signal' },
      { id: 'SIG_AN', label: 'AN', position: 'top', slotOffset: 4.82, yOffset: 12, type: 'screw', defaultRole: 'signal' },
      { id: 'SIG_BR', label: 'BR', position: 'bottom', slotOffset: 4.55, yOffset: 146, type: 'screw', defaultRole: 'signal' },
      { id: 'SIG_BN', label: 'BN', position: 'bottom', slotOffset: 4.82, yOffset: 146, type: 'screw', defaultRole: 'signal' }
    ],
    description: '6-Module Dual Power 100A Automatic Transfer Switch (ATS-GQ2-2P) for switching between City Grid and Generator/Standby.'
  },

  // ACCESSORIES
  {
    typeId: 'blank-plate-1m',
    name: 'Blanking Plate (1 Module)',
    category: 'accessory',
    widthModules: 1,
    poles: 1,
    colorAccent: '#cbd5e1',
    terminals: [],
    description: 'Standard 18mm blanking cover for unused slots.'
  }
];

export function getDeviceDef(typeId: string): DeviceDefinition | undefined {
  return DEVICE_CATALOG.find((d) => d.typeId === typeId);
}
