<script lang="ts">
  import type { FreeEquipment, WireRole } from "#lib/types";

  interface Props {
    eq: FreeEquipment;
    w: number;
    h: number;
    isSelected: boolean;
    onEquipmentTerminalMouseDown: (
      eqId: string,
      termId: string,
      defaultRole: WireRole,
      e: MouseEvent,
    ) => void;
    onTerminalMouseUp: (
      deviceId: string,
      terminalId: string,
      e: MouseEvent,
    ) => void;
  }

  let {
    eq,
    w,
    h,
    isSelected,
    onEquipmentTerminalMouseDown,
    onTerminalMouseUp,
  }: Props = $props();
</script>

<!-- MCCB (Molded Case Circuit Breaker) -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="6"
  fill="#1e293b"
  stroke={isSelected ? "#38bdf8" : "#64748b"}
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
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L1_IN", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L1_IN", e)}
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
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L2_IN", "line2", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L2_IN", e)}
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
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L1_OUT", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L1_OUT", e)}
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
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L2_OUT", "line2", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L2_OUT", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <circle r="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" class="group-hover/mccbl2out:scale-125" />
  <text x="0" y="14" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#dc2626">L2 OUT</text>
</g>

