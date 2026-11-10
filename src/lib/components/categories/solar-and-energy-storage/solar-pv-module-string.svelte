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

  const isTop = $derived((eq.terminalPosition || "top") !== "bottom");
  const termY = $derived(isTop ? 16 : h - 16);
</script>

<!-- SOLAR PANEL (Photovoltaic Monocrystalline Module) -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="6"
  fill="#091428"
  stroke={isSelected ? "#38bdf8" : "#94a3b8"}
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
<rect
  x={w / 2 - 38}
  y={isTop ? 8 : 10}
  width="76"
  height="13"
  rx="3"
  fill="#fef3c7"
  stroke="#f59e0b"
  stroke-width="0.8"
/>
<text
  x={w / 2}
  y={isTop ? 17.5 : 19.5}
  font-size="7"
  font-weight="900"
  fill="#b45309"
  text-anchor="middle"
  font-family="monospace"
>
  ☀️ PV MODULE
</text>

<!-- Rated Power Display -->
<text
  x={w / 2}
  y={h / 2 - 2}
  font-size="16"
  font-weight="900"
  fill="#ffffff"
  text-anchor="middle"
  font-family="system-ui, sans-serif"
>
  {eq.powerWatts || 550}W
</text>
<!-- Specs Subtitle -->
<text
  x={w / 2}
  y={h / 2 + 13}
  font-size="7"
  font-weight="bold"
  fill="#38bdf8"
  text-anchor="middle"
  font-family="monospace"
>
  {eq.voltage || 41.5}V • {eq.current || 13.25}A
</text>

<!-- Label / Name (Top if terminals at bottom, Bottom if terminals at top) -->
<text
  x={w / 2}
  y={isTop ? h - 16 : 32}
  font-size="7.5"
  font-weight="bold"
  fill="#f8fafc"
  text-anchor="middle"
>
  {eq.label}
</text>

<!-- TERMINAL PV+ (DC Positive - Left) -->
<g
  class="terminal cursor-pointer group/pvpos"
  transform="translate(30, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV+", "dc_pos", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV+", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Solar PV+ Positive Terminal ({isTop ? 'Top' : 'Bottom'})</title>
  <circle r="7" fill="#dc2626" stroke="#fecaca" stroke-width="1.5" class="group-hover/pvpos:scale-125" />
  <text x="0" y="2.5" text-anchor="middle" font-size="7" font-weight="900" fill="#ffffff">+</text>
  <text
    x="0"
    y={isTop ? -10 : 13}
    text-anchor="middle"
    font-size="6"
    font-weight="bold"
    fill="#ef4444"
  >
    PV+
  </text>
</g>

<!-- TERMINAL PV- (DC Negative - Right) -->
<g
  class="terminal cursor-pointer group/pvneg"
  transform="translate({w - 30}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PV-", "dc_neg", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PV-", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Solar PV- Negative Terminal ({isTop ? 'Top' : 'Bottom'})</title>
  <circle r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" class="group-hover/pvneg:scale-125" />
  <text x="0" y="2.5" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">-</text>
  <text
    x="0"
    y={isTop ? -10 : 13}
    text-anchor="middle"
    font-size="6"
    font-weight="bold"
    fill="#cbd5e1"
  >
    PV-
  </text>
</g>
