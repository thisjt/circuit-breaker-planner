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
  const words = $derived(eq.label.split(" "));
  const line1 = $derived(
    words.length > 1 && eq.label.length > 10
      ? words.slice(0, Math.ceil(words.length / 2)).join(" ")
      : eq.label,
  );
  const line2 = $derived(
    words.length > 1 && eq.label.length > 10
      ? words.slice(Math.ceil(words.length / 2)).join(" ")
      : "",
  );
</script>

<!-- DETACHED FIELD CONNECTION BLOCK (Junction / External I/O) -->
<rect
  x="0"
  y="0"
  width={w}
  height={h}
  rx="6"
  fill="#ffffff"
  stroke={isSelected ? "#2563eb" : "#94a3b8"}
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
  {eq.description || "230V 2-Wire"}
</text>

<!-- TERMINAL 1 (Line 1) -->
<g
  class="terminal cursor-pointer group/term1"
  transform="translate(24, {termY})"
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "1", "line1", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "1", e)}
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
  onmousedown={(e) => onEquipmentTerminalMouseDown(eq.id, "2", "neutral", e)}
  onmouseup={(e) => onTerminalMouseUp(eq.id, "2", e)}
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

