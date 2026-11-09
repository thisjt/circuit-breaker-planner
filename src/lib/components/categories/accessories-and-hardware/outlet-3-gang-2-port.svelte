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

  const isTop = $derived(eq.terminalPosition !== "bottom");
  const termY = $derived(isTop ? 14 : h - 14);
</script>

<!-- OUTLET 3-GANG 2-PORT WALL RECEPTACLE -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="6"
  fill="#f8fafc"
  stroke={isSelected ? "#2563eb" : "#94a3b8"}
  stroke-width={isSelected ? 3 : 1.5}
  class="hover:stroke-blue-400"
/>
<!-- Top Slate/Blue Faceplate Accent -->
<rect x="0" y="0" width={w} height="4" rx="2" fill="#475569" />

<!-- Header Pill: 3-GANG 2-PORT + Amps -->
<rect
  x="10"
  y={isTop ? 25 : 6}
  width={w - 20}
  height="11"
  rx="2"
  fill="#e2e8f0"
  stroke="#cbd5e1"
  stroke-width="0.7"
/>
<text
  x={w / 2}
  y={isTop ? 32.5 : 13.5}
  font-size="5.6"
  font-weight="900"
  fill="#0f172a"
  text-anchor="middle"
  font-family="monospace"
>
  3-GANG 2-PORT • {eq.ratedAmps ?? 16}A
</text>

<!-- 3-Gang 2-Port Receptacle Modules -->
<g transform="translate(12, {isTop ? 40 : 21})">
  {#each [0, 1, 2] as gang}
    {@const gx = gang * 37}
    <rect
      x={gx}
      y="0"
      width="34"
      height="24"
      rx="2.5"
      fill="#ffffff"
      stroke="#94a3b8"
      stroke-width="1"
    />
    <!-- 2-Port Slots (Left & Right Prong Slots) -->
    <rect x={gx + 10} y="7" width="2.4" height="9" rx="0.8" fill="#1e293b" />
    <rect x={gx + 21.6} y="7" width="2.4" height="9" rx="0.8" fill="#1e293b" />
  {/each}
</g>

<!-- Label -->
<text
  x={w / 2}
  y={isTop ? 76 : 57}
  font-size="7.2"
  font-weight="900"
  fill="#0f172a"
  text-anchor="middle"
  font-family="system-ui, sans-serif"
>
  {eq.label}
</text>

<!-- TERMINALS: L (Left), N (Center), PE (Right) -->
<g
  class="terminal cursor-pointer group/outl"
  transform="translate(24, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "L", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "L", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Outlet Line (L / L1)</title>
  <circle
    r="5.5"
    fill="#dc2626"
    stroke="#fecaca"
    stroke-width="1.3"
    class="group-hover/outl:scale-125"
  />
  <text
    x="0"
    y={isTop ? -8 : 13}
    text-anchor="middle"
    font-size="5"
    font-weight="bold"
    fill="#dc2626">L</text
  >
</g>

<g
  class="terminal cursor-pointer group/outn"
  transform="translate({w / 2}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "N", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "N", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Outlet Neutral / Line 2 (N)</title>
  <circle
    r="5.5"
    fill="#0284c7"
    stroke="#e0f2fe"
    stroke-width="1.3"
    class="group-hover/outn:scale-125"
  />
  <text
    x="0"
    y={isTop ? -8 : 13}
    text-anchor="middle"
    font-size="5"
    font-weight="bold"
    fill="#0284c7">N</text
  >
</g>

<g
  class="terminal cursor-pointer group/outpe"
  transform="translate({w - 24}, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "PE", "earth", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "PE", e)}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
>
  <circle r="14" fill="transparent" />
  <title>Outlet Protective Earth (PE)</title>
  <circle
    r="5.5"
    fill="#16a34a"
    stroke="#bbf7d0"
    stroke-width="1.3"
    class="group-hover/outpe:scale-125"
  />
  <text
    x="0"
    y={isTop ? -8 : 13}
    text-anchor="middle"
    font-size="5"
    font-weight="bold"
    fill="#16a34a">PE</text
  >
</g>
