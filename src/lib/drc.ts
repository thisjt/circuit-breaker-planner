import type { DRCWarning, PanelConfig, PlacedDevice, WireConnection } from './types';
import { getDeviceDef } from './catalog';
import { getGaugeDef } from './wireStandards';

export function runDesignRuleCheck(
  config: PanelConfig,
  devices: PlacedDevice[],
  wires: WireConnection[]
): DRCWarning[] {
  const warnings: DRCWarning[] = [];

  // 1. Check rail capacity
  for (let r = 0; r < config.rows; r++) {
    const railDevices = devices.filter((d) => d.railIndex === r);
    const totalModules = railDevices.reduce((sum, d) => sum + d.widthModules, 0);
    if (totalModules > config.slotsPerRow) {
      warnings.push({
        id: `rail-overflow-${r}`,
        level: 'error',
        title: `Rail ${r + 1} Over capacity`,
        message: `Rail ${r + 1} has ${totalModules} modules placed, exceeding the rail limit of ${config.slotsPerRow} modules.`
      });
    }
  }

  // 2. Wire gauge vs breaker ampacity check
  for (const wire of wires) {
    const gauge = getGaugeDef(wire.gaugeMetric);
    const sourceDev = devices.find((d) => d.id === wire.sourceDeviceId);
    const targetDev = devices.find((d) => d.id === wire.targetDeviceId);

    // If connected to a breaker output terminal
    const checkBreakerAmpacity = (dev: PlacedDevice | undefined, terminalId: string) => {
      if (!dev) return;
      const def = getDeviceDef(dev.typeId);
      if (def?.category === 'terminal') return;
      const breakerAmps = dev.ratedAmps || def?.ratedAmps;
      
      // Check if this terminal is an OUT terminal on a protection breaker
      const isOutTerminal = terminalId.toLowerCase().includes('out') || terminalId === '2' || terminalId === '4' || terminalId === '6';
      
      if (breakerAmps && isOutTerminal && gauge.maxAmps < breakerAmps) {
        warnings.push({
          id: `amp-mismatch-${wire.id}-${dev.id}`,
          level: 'warning',
          title: 'Wire Gauge Ampacity Mismatch',
          message: `Wire (${wire.gaugeMetric} mm² / max ~${gauge.maxAmps}A) is connected to ${dev.customLabel || def?.name} (${breakerAmps}A). Risk of wire overheating under prolonged overload.`,
          relatedDeviceIds: [dev.id],
          relatedWireIds: [wire.id]
        });
      }
    };

    checkBreakerAmpacity(sourceDev, wire.sourceTerminalId);
    checkBreakerAmpacity(targetDev, wire.targetTerminalId);
  }

  // 3. Direct Short-Circuit Check (Linking Line directly to Neutral or Earth)
  for (const wire of wires) {
    const isLineRole = wire.role.startsWith('line');
    const isNeutralOrEarth = wire.role === 'neutral' || wire.role === 'earth';

    const srcIsBar = wire.sourceDeviceId === 'PE_BAR' || wire.sourceDeviceId === 'N_BAR';
    const tgtIsBar = wire.targetDeviceId === 'PE_BAR' || wire.targetDeviceId === 'N_BAR';

    if (srcIsBar && tgtIsBar && wire.sourceDeviceId !== wire.targetDeviceId) {
      warnings.push({
        id: `short-bar-${wire.id}`,
        level: 'error',
        title: 'Neutral to Earth Direct Link',
        message: 'Direct connection detected between Neutral Bar and Earth Bar. Check if Main Bonding Jumper is intentional.',
        relatedWireIds: [wire.id]
      });
    }
  }

  // 4. Overloaded Terminal Clamp (> 2 wires on a single terminal)
  const terminalUsageMap = new Map<string, string[]>(); // key: "deviceId:terminalId", value: wireIds[]

  for (const wire of wires) {
    const srcKey = `${wire.sourceDeviceId}:${wire.sourceTerminalId}`;
    const tgtKey = `${wire.targetDeviceId}:${wire.targetTerminalId}`;

    if (!terminalUsageMap.has(srcKey)) terminalUsageMap.set(srcKey, []);
    terminalUsageMap.get(srcKey)!.push(wire.id);

    if (!terminalUsageMap.has(tgtKey)) terminalUsageMap.set(tgtKey, []);
    terminalUsageMap.get(tgtKey)!.push(wire.id);
  }

  for (const [key, wireIds] of terminalUsageMap.entries()) {
    if (wireIds.length > 2 && !key.startsWith('PE_BAR') && !key.startsWith('N_BAR')) {
      const [devId, termId] = key.split(':');
      const dev = devices.find((d) => d.id === devId);
      warnings.push({
        id: `term-overload-${key}`,
        level: 'warning',
        title: 'Terminal Clamp Overcrowded',
        message: `Terminal ${termId} on ${dev?.customLabel || 'Device'} has ${wireIds.length} wires connected. Most DIN terminals recommend at most 2 conductors.`,
        relatedDeviceIds: dev ? [dev.id] : [],
        relatedWireIds: wireIds
      });
    }
  }

  return warnings;
}

