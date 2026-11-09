<script lang="ts">
  import type { PlacedDevice, TerminalDef } from "#lib/types";
  import { getDeviceDef } from "#lib/catalog";
  import { panelStore } from "#lib/state.svelte";

  interface Props {
    device: PlacedDevice;
    x: number;
    y: number;
    moduleWidthPx?: number;
    heightPx?: number;
    onTerminalMouseDown?: (
      deviceId: string,
      terminalId: string,
      event: MouseEvent,
    ) => void;
    onTerminalMouseUp?: (
      deviceId: string,
      terminalId: string,
      event: MouseEvent,
    ) => void;
  }

  let {
    device,
    x,
    y,
    moduleWidthPx = 44,
    heightPx = 160,
    onTerminalMouseDown,
    onTerminalMouseUp,
  }: Props = $props();

  const def = $derived(getDeviceDef(device.typeId));
  const isSelected = $derived(
    panelStore.selectedType === "device" && panelStore.selectedId === device.id,
  );

  const totalWidth = $derived(device.widthModules * moduleWidthPx);
  const poles = $derived(def?.poles || 1);

  // Group terminals by top and bottom
  const topTerminals = $derived(
    def?.terminals.filter((t) => t.position === "top") || [],
  );
  const bottomTerminals = $derived(
    def?.terminals.filter((t) => t.position === "bottom") || [],
  );

  function handleDeviceClick(e: MouseEvent) {
    e.stopPropagation();
    if (panelStore.activeTool === "select") {
      panelStore.select("device", device.id);
    }
  }

  function handleTerminalClick(term: TerminalDef, e: MouseEvent) {
    e.stopPropagation();
    if (onTerminalMouseDown) {
      onTerminalMouseDown(device.id, term.id, e);
    }
  }

  function handleTerminalRelease(term: TerminalDef, e: MouseEvent) {
    e.stopPropagation();
    if (onTerminalMouseUp) {
      onTerminalMouseUp(device.id, term.id, e);
    }
  }
</script>

<g
  class="device-item cursor-pointer select-none transition-transform"
  transform="translate({x}, {y})"
  onclick={handleDeviceClick}
  role="button"
  tabindex="0"
>
  <!-- Outer Enclosure / DIN Box body -->
  <rect
    x="1"
    y="1"
    width={totalWidth - 2}
    height={heightPx - 2}
    rx="4"
    fill="#f8fafc"
    stroke={isSelected ? "#2563eb" : "#94a3b8"}
    stroke-width={isSelected ? 3 : 1.5}
    class="filter drop-shadow-sm hover:stroke-blue-400"
  />

  <!-- Internal slot dividers for multi-module devices -->
  {#if device.widthModules > 1 && def?.category !== "ats"}
    {#each Array(device.widthModules - 1) as _, i}
      <line
        x1={(i + 1) * moduleWidthPx}
        y1="2"
        x2={(i + 1) * moduleWidthPx}
        y2={heightPx - 2}
        stroke="#cbd5e1"
        stroke-dasharray="3,3"
      />
    {/each}
  {/if}

  {#if def?.typeId === "ats-2p-100a"}
    <!-- ATS (Automatic Transfer Switch) Specialized Rendering -->
    <!-- Top & Bottom high-current isolation barriers between poles -->
    <rect x="0" y="0" width="3" height="34" fill="#cbd5e1" />
    <rect x="42.5" y="0" width="3" height="34" fill="#cbd5e1" />
    <rect x="86.5" y="0" width="3" height="34" fill="#cbd5e1" />

    <rect x="0" y="98" width="3" height="62" fill="#cbd5e1" />
    <rect x="42.5" y="98" width="3" height="62" fill="#cbd5e1" />
    <rect x="86.5" y="98" width="3" height="62" fill="#cbd5e1" />

    <!-- Terminal cavities for power terminals -->
    <rect
      x="4"
      y="2"
      width="38"
      height="26"
      rx="2"
      fill="#e2e8f0"
      stroke="#cbd5e1"
    />
    <rect
      x="47"
      y="2"
      width="38"
      height="26"
      rx="2"
      fill="#e2e8f0"
      stroke="#cbd5e1"
    />

    <rect
      x="4"
      y="103"
      width="38"
      height="22"
      rx="2"
      fill="#e2e8f0"
      stroke="#cbd5e1"
    />
    <rect
      x="47"
      y="103"
      width="38"
      height="22"
      rx="2"
      fill="#e2e8f0"
      stroke="#cbd5e1"
    />

    <rect
      x="4"
      y="135"
      width="38"
      height="22"
      rx="2"
      fill="#e2e8f0"
      stroke="#cbd5e1"
    />
    <rect
      x="47"
      y="135"
      width="38"
      height="22"
      rx="2"
      fill="#e2e8f0"
      stroke="#cbd5e1"
    />

    <!-- Front Raised Faceplate -->
    <rect
      x="3"
      y="32"
      width={totalWidth - 6}
      height="94"
      rx="3"
      fill="#f8fafc"
      stroke="#cbd5e1"
      stroke-width="1"
    />

    <!-- Left Glossy Phase Plate (Modules 0-2) -->
    <rect
      x="4"
      y="33"
      width="82"
      height="92"
      rx="2"
      fill="#18181b"
      stroke="#27272a"
      stroke-width="1"
    />
    <text
      x="45"
      y="48"
      text-anchor="middle"
      font-size="6.5"
      font-weight="bold"
      fill="#f1f5f9"
      class="tracking-wider"
    >
      Normal Power A
    </text>
    <text
      x="22"
      y="84"
      text-anchor="middle"
      font-size="24"
      font-weight="900"
      fill="#ffffff"
      font-family="system-ui, sans-serif"
    >
      R
    </text>
    <text
      x="66"
      y="84"
      text-anchor="middle"
      font-size="24"
      font-weight="900"
      fill="#ffffff"
      font-family="system-ui, sans-serif"
    >
      N
    </text>
    <text
      x="45"
      y="114"
      text-anchor="middle"
      font-size="6.5"
      font-weight="bold"
      fill="#f1f5f9"
      class="tracking-wider"
    >
      Reverse Power B
    </text>

    <!-- Center Rotary Control Section (Modules 2-3.5) -->
    <rect
      x="88"
      y="33"
      width="68"
      height="92"
      fill="#ffffff"
      stroke="#e2e8f0"
      stroke-width="0.8"
    />

    <!-- Top Source A indicator -->
    <text
      x="122"
      y="45"
      text-anchor="middle"
      font-size="6"
      font-weight="bold"
      fill="#475569"
    >
      Normal Power A
    </text>
    <rect x="116" y="48" width="12" height="7" rx="1" fill="#0f172a" />
    <text
      x="122"
      y="54"
      text-anchor="middle"
      font-size="6"
      font-weight="bold"
      fill="#ef4444"
    >
      I
    </text>

    <!-- Rotary Dial Switch -->
    <g class="rotary-switch">
      <!-- Dial Outer Rim -->
      <circle
        cx="122"
        cy="79"
        r="17"
        fill="#dc2626"
        stroke="#b91c1c"
        stroke-width="1.5"
      />
      <circle cx="122" cy="79" r="14" fill="#ef4444" />
      <!-- Pointer Handle (rotated -25 deg) -->
      <g transform="rotate(-25, 122, 79)">
        <polygon points="119,64 125,64 124,94 120,94" fill="#991b1b" />
        <rect x="120" y="65" width="4" height="28" rx="2" fill="#b91c1c" />
        <circle cx="122" cy="79" r="4" fill="#dc2626" />
      </g>
      <!-- Rotation curved arrow arc -->
      <path
        d="M 143 71 A 22 22 0 0 1 143 87"
        fill="none"
        stroke="#64748b"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <polygon points="142,69 145,73 140,73" fill="#64748b" />
      <polygon points="142,89 145,85 140,85" fill="#64748b" />
    </g>

    <!-- Bottom Source B indicator -->
    <rect x="116" y="101" width="12" height="7" rx="1" fill="#0f172a" />
    <text
      x="122"
      y="107"
      text-anchor="middle"
      font-size="6"
      font-weight="bold"
      fill="#64748b"
    >
      O
    </text>
    <text
      x="122"
      y="118"
      text-anchor="middle"
      font-size="6"
      font-weight="bold"
      fill="#475569"
    >
      Reverse Power B
    </text>

    <!-- Right Specifications & Control Section (Modules 3.5-6) -->
    <rect
      x="158"
      y="33"
      width={totalWidth - 160}
      height="92"
      fill="#ffffff"
      stroke="#e2e8f0"
      stroke-width="0.8"
    />

    <!-- Brand Header -->
    <g transform="translate(164, 40)">
      <!-- Spiral/Q Logo mark -->
      <circle
        cx="5"
        cy="5"
        r="4.5"
        fill="none"
        stroke="#0f172a"
        stroke-width="1.2"
      />
      <path
        d="M 5 2.5 A 2.5 2.5 0 0 1 7.5 5"
        fill="none"
        stroke="#dc2626"
        stroke-width="1.2"
      />
      <text
        x="13"
        y="8"
        font-size="8"
        font-weight="900"
        fill="#0f172a"
        font-family="system-ui, sans-serif"
      >
        GRANDQ
      </text>
    </g>

    <!-- Model Badge Box -->
    <rect x="164" y="52" width="66" height="10" rx="1" fill="#334155" />
    <text
      x="197"
      y="59.5"
      text-anchor="middle"
      font-size="7"
      font-weight="bold"
      fill="#ffffff"
      font-family="monospace"
    >
      ATS-GQ2-2P
    </text>

    <!-- Ratings specs list -->
    <text
      x="164"
      y="68.5"
      font-size="5"
      fill="#334155"
      font-family="system-ui, sans-serif"
    >
      Rated working current: <tspan font-weight="bold">100A</tspan>
    </text>
    <text
      x="164"
      y="75"
      font-size="5"
      fill="#334155"
      font-family="system-ui, sans-serif"
    >
      Rated working voltage: <tspan font-weight="bold">220V AC</tspan>
    </text>
    <text
      x="164"
      y="81.5"
      font-size="5"
      fill="#334155"
      font-family="system-ui, sans-serif"
    >
      Insulation voltage: <tspan font-weight="bold">690V AC</tspan>
    </text>
    <text
      x="164"
      y="88"
      font-size="5"
      fill="#334155"
      font-family="system-ui, sans-serif"
    >
      Impact-resistant voltage: <tspan font-weight="bold">8kV</tspan>
    </text>
    <text
      x="164"
      y="94.5"
      font-size="5"
      fill="#334155"
      font-family="system-ui, sans-serif"
    >
      Standard: <tspan font-weight="bold">IEC60947-6-1</tspan>
    </text>
    <text
      x="164"
      y="101"
      font-size="5"
      fill="#334155"
      font-family="system-ui, sans-serif"
    >
      Control voltage: <tspan font-weight="bold">AC220V</tspan>
    </text>

    <!-- CE Mark -->
    <text
      x="168"
      y="116"
      font-size="9"
      font-weight="900"
      fill="#0f172a"
      font-family="system-ui, sans-serif"
    >
      CE
    </text>

    <!-- Right Controls Column -->
    <!-- Indicator A (Normal active) -->
    <circle
      cx="242"
      cy="44"
      r="3.5"
      fill="#ef4444"
      stroke="#b91c1c"
      stroke-width="0.8"
    />
    <circle cx="241" cy="43" r="1" fill="#ffffff" opacity="0.6" />
    <text x="250" y="46.5" font-size="6.5" font-weight="bold" fill="#0f172a">
      A
    </text>

    <!-- Manual / Auto Slide Switch -->
    <text
      x="243"
      y="57"
      text-anchor="middle"
      font-size="5.5"
      font-weight="bold"
      fill="#475569"
    >
      Manual
    </text>
    <!-- Switch track -->
    <rect x="239" y="60" width="8" height="18" rx="2" fill="#0f172a" />
    <!-- Switch knob in Auto position (down) -->
    <rect
      x="238"
      y="69"
      width="10"
      height="8"
      rx="1"
      fill="#475569"
      stroke="#1e293b"
      stroke-width="0.5"
    />
    <line
      x1="240"
      y1="72"
      x2="246"
      y2="72"
      stroke="#94a3b8"
      stroke-width="0.6"
    />
    <line
      x1="240"
      y1="74"
      x2="246"
      y2="74"
      stroke="#94a3b8"
      stroke-width="0.6"
    />
    <text
      x="243"
      y="86"
      text-anchor="middle"
      font-size="5.5"
      font-weight="bold"
      fill="#475569"
    >
      Auto
    </text>

    <!-- Indicator B (Standby active) -->
    <circle
      cx="242"
      cy="96"
      r="3.5"
      fill="#22c55e"
      stroke="#15803d"
      stroke-width="0.8"
    />
    <circle cx="241" cy="95" r="1" fill="#ffffff" opacity="0.6" />
    <text x="250" y="98.5" font-size="6.5" font-weight="bold" fill="#0f172a">
      B
    </text>

    <!-- Top-Right Auxiliary Terminal Block & City Power graphics -->
    <g class="top-auxiliary">
      <!-- City Power grid icon / label -->
      <text
        x="146"
        y="13"
        font-size="6"
        font-weight="bold"
        fill="#334155"
        text-anchor="middle"
      >
        City Power
      </text>
      <!-- Transmission tower icon -->
      <path
        d="M 146 15 L 141 30 M 146 15 L 151 30 M 140 21 L 152 21 M 139 26 L 153 26 M 142 21 L 150 26 M 150 21 L 142 26"
        fill="none"
        stroke="#475569"
        stroke-width="0.8"
      />
      <!-- Green block -->
      <rect
        x="194"
        y="4"
        width="64"
        height="15"
        rx="2"
        fill="#15803d"
        stroke="#14532d"
        stroke-width="0.8"
      />
      {#each [200, 212, 224, 236, 248] as hx}
        <circle
          cx={hx}
          cy="11.5"
          r="2.5"
          fill="#052e16"
          stroke="#22c55e"
          stroke-width="0.5"
        />
      {/each}
      <text x="206" y="27" font-size="5" fill="#475569" text-anchor="middle"
        >AC 220V In</text
      >
      <text x="240" y="27" font-size="5" fill="#475569" text-anchor="middle"
        >Passive Out</text
      >
    </g>

    <!-- Bottom-Right Auxiliary Terminal Block & Generator graphics -->
    <g class="bottom-auxiliary">
      <!-- Generator icon / label -->
      <text
        x="146"
        y="136"
        font-size="6"
        font-weight="bold"
        fill="#334155"
        text-anchor="middle"
      >
        Generator
      </text>
      <!-- Generator vector box -->
      <rect
        x="139"
        y="139"
        width="14"
        height="10"
        rx="1.5"
        fill="#e2e8f0"
        stroke="#475569"
        stroke-width="0.8"
      />
      <circle cx="143" cy="144" r="1.5" fill="#64748b" />
      <rect x="147" y="142" width="4" height="4" fill="#64748b" />
      <!-- Green block -->
      <rect
        x="194"
        y="139"
        width="64"
        height="15"
        rx="2"
        fill="#15803d"
        stroke="#14532d"
        stroke-width="0.8"
      />
      {#each [200, 212, 224, 236, 248] as hx}
        <circle
          cx={hx}
          cy="146.5"
          r="2.5"
          fill="#052e16"
          stroke="#22c55e"
          stroke-width="0.5"
        />
      {/each}
      <text x="206" y="136" font-size="5" fill="#475569" text-anchor="middle"
        >AC 220V In</text
      >
      <text x="240" y="136" font-size="5" fill="#475569" text-anchor="middle"
        >Passive Out</text
      >
    </g>
  {:else if def?.typeId === "mts-2p-63a"}
    <!-- TAXNELE TX219G 63A 2-Pole Manual Transfer Switch (MTS) -->
    <!-- Center module divider lines -->
    <line x1="44" y1="2" x2="44" y2="32" stroke="#cbd5e1" stroke-width="1.5" />
    <line x1="44" y1="126" x2="44" y2="158" stroke="#cbd5e1" stroke-width="1.5" />

    <!-- Terminal cavity recesses -->
    <rect x="4" y="2" width="36" height="28" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />
    <rect x="48" y="2" width="36" height="28" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />
    <rect x="4" y="130" width="36" height="28" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />
    <rect x="48" y="130" width="36" height="28" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Top Blank Dummy Plugs (Terminal 3 and Terminal 7 are sealed with black caps) -->
    <circle cx="31.68" cy="12" r="5.5" fill="#1e293b" stroke="#0f172a" stroke-width="0.8" />
    <circle cx="31.68" cy="12" r="4" fill="#0f172a" />
    <circle cx="75.68" cy="12" r="5.5" fill="#1e293b" stroke="#0f172a" stroke-width="0.8" />
    <circle cx="75.68" cy="12" r="4" fill="#0f172a" />

    <!-- Top Terminal Silkscreen Numbers -->
    <text x="12.32" y="27" font-size="7" font-weight="bold" fill="#334155" text-anchor="middle">1</text>
    <text x="31.68" y="27" font-size="7" font-weight="bold" fill="#64748b" text-anchor="middle">3</text>
    <text x="56.32" y="27" font-size="7" font-weight="bold" fill="#334155" text-anchor="middle">5</text>
    <text x="75.68" y="27" font-size="7" font-weight="bold" fill="#64748b" text-anchor="middle">7</text>

    <!-- Bottom Terminal Silkscreen Numbers -->
    <text x="12.32" y="136" font-size="7" font-weight="bold" fill="#334155" text-anchor="middle">2</text>
    <text x="31.68" y="136" font-size="7" font-weight="bold" fill="#334155" text-anchor="middle">4</text>
    <text x="56.32" y="136" font-size="7" font-weight="bold" fill="#334155" text-anchor="middle">6</text>
    <text x="75.68" y="136" font-size="7" font-weight="bold" fill="#334155" text-anchor="middle">8</text>

    <!-- Raised 45mm DIN Faceplate -->
    <rect
      x="3"
      y="32"
      width={totalWidth - 6}
      height="94"
      rx="3"
      fill="#ffffff"
      stroke="#cbd5e1"
      stroke-width="1"
    />

    <!-- Brand Header: TAXNELE with 4 blue horizontal lines -->
    <text
      x="6"
      y="43"
      font-size="7"
      font-weight="900"
      font-style="italic"
      fill="#2563eb"
      font-family="system-ui, sans-serif"
    >
      TAXNELE
    </text>
    <line x1="44" y1="38" x2="82" y2="38" stroke="#3b82f6" stroke-width="0.8" />
    <line x1="44" y1="40" x2="82" y2="40" stroke="#3b82f6" stroke-width="0.8" />
    <line x1="44" y1="42" x2="82" y2="42" stroke="#3b82f6" stroke-width="0.8" />
    <line x1="44" y1="44" x2="82" y2="44" stroke="#3b82f6" stroke-width="0.8" />

    <!-- Model & Rating Info -->
    <text x="6" y="52" font-size="6" font-weight="bold" fill="#0f172a" font-family="system-ui, sans-serif">
      TX219G
    </text>
    <text x="27" y="52" font-size="7.5" font-weight="900" fill="#0f172a" font-family="system-ui, sans-serif">
      63A
    </text>
    <text x="6" y="58" font-size="4.5" fill="#475569" font-family="system-ui, sans-serif">
      400V~
    </text>
    <text x="6" y="63" font-size="4.5" fill="#475569" font-family="system-ui, sans-serif">
      50/60Hz
    </text>
    <text x="26" y="62" font-size="7" font-weight="900" fill="#0f172a" font-family="system-ui, sans-serif">
      CE
    </text>

    <!-- Schematic Symbol on the right side of the faceplate -->
    <g class="schematic" transform="translate(48, 46)">
      <!-- Top contact terminals 1 and 5 -->
      <circle cx="5" cy="4" r="1.5" fill="none" stroke="#0f172a" stroke-width="0.7" />
      <text x="5" y="2" font-size="4" fill="#0f172a" text-anchor="middle">1</text>
      <circle cx="25" cy="4" r="1.5" fill="none" stroke="#0f172a" stroke-width="0.7" />
      <text x="25" y="2" font-size="4" fill="#0f172a" text-anchor="middle">5</text>

      <!-- Switch blades -->
      <line x1="5" y1="5.5" x2="4" y2="12" stroke="#0f172a" stroke-width="0.8" />
      <line x1="25" y1="5.5" x2="24" y2="12" stroke="#0f172a" stroke-width="0.8" />
      <!-- Mechanical tie line -->
      <line x1="5" y1="9" x2="25" y2="9" stroke="#0f172a" stroke-width="0.6" stroke-dasharray="1.5,1.5" />

      <!-- Position indicators I and II -->
      <text x="1" y="9.5" font-size="4" font-weight="bold" fill="#0f172a">I</text>
      <text x="31" y="9.5" font-size="4" font-weight="bold" fill="#0f172a">II</text>

      <!-- Bottom contacts 2, 4, 6, 8 -->
      <text x="1" y="16" font-size="4" fill="#0f172a">2</text>
      <text x="7" y="16" font-size="4" fill="#0f172a">4</text>
      <text x="21" y="16" font-size="4" fill="#0f172a">6</text>
      <text x="27" y="16" font-size="4" fill="#0f172a">8</text>
    </g>

    <!-- Toggle Track Recesses (Pole 1 & Pole 2) -->
    <rect x="7" y="66" width="34" height="38" rx="2" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.8" />
    <rect x="47" y="66" width="34" height="38" rx="2" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Position labels inside track -->
    <text x="24" y="74" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#64748b">I</text>
    <text x="24" y="100" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#64748b">II</text>
    <text x="64" y="74" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#64748b">I</text>
    <text x="64" y="100" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#64748b">II</text>

    <!-- White Breaker Levers -->
    <rect x="12" y="76" width="24" height="18" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />
    <rect x="52" y="76" width="24" height="18" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />

    <!-- Horizontal White Interlock Handle Tie Bar linking both poles -->
    <rect x="4" y="80" width="80" height="10" rx="2" fill="#f8fafc" stroke="#64748b" stroke-width="1" class="filter drop-shadow-sm" />
    <!-- Center Grip Clip -->
    <rect x="34" y="79" width="20" height="12" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />
    <line x1="41" y1="81" x2="41" y2="89" stroke="#cbd5e1" stroke-width="0.8" />
    <line x1="44" y1="81" x2="44" y2="89" stroke="#cbd5e1" stroke-width="0.8" />
    <line x1="47" y1="81" x2="47" y2="89" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Center vertical dividing seam on bottom faceplate -->
    <line x1="44" y1="105" x2="44" y2="125" stroke="#cbd5e1" stroke-width="1" />
  {:else if def?.typeId === "terminal-dist-1in4out"}
    <!-- 1-IN 4-OUT UNIPOLAR DISTRIBUTION BLOCK (UKK 80A Style) -->
    <!-- Top cavity for incoming 16mm² terminal -->
    <rect x="4" y="2" width="36" height="26" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Bottom tiered cavities for 4 branch terminals -->
    <rect x="4" y="114" width="36" height="20" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />
    <rect x="4" y="136" width="36" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Center Modular Faceplate Body -->
    <rect
      x="3"
      y="30"
      width={totalWidth - 6}
      height="82"
      rx="3"
      fill="#f8fafc"
      stroke="#cbd5e1"
      stroke-width="1.2"
    />

    <!-- Sky Blue Category Accent Strip -->
    <rect
      x="3"
      y="30"
      width={totalWidth - 6}
      height="4"
      rx="1.5"
      fill={def?.colorAccent || "#0284c7"}
    />

    <!-- Title Badge -->
    <text
      x={totalWidth / 2}
      y="42"
      text-anchor="middle"
      font-size="6"
      font-weight="900"
      fill="#0f172a"
      font-family="system-ui, sans-serif"
    >
      {device.customLabel || "DIST BLOCK"}
    </text>

    <!-- Subtitle Pill: 1-IN 4-OUT -->
    <rect x="6" y="46" width="32" height="9" rx="1.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.5" />
    <text
      x={totalWidth / 2}
      y="52.5"
      text-anchor="middle"
      font-size="4.8"
      font-weight="900"
      fill="#0369a1"
      font-family="monospace"
    >
      1-IN  4-OUT
    </text>

    <!-- Ratings -->
    <text
      x={totalWidth / 2}
      y="61"
      text-anchor="middle"
      font-size="4.5"
      font-weight="bold"
      fill="#64748b"
      font-family="monospace"
    >
      80A 500V~
    </text>

    <!-- Internal Distribution Copper Bus Graphic -->
    <g class="bus-schematic" transform="translate(6, 65)">
      <!-- Main Feed In -->
      <line x1="16" y1="0" x2="16" y2="7" stroke="#d97706" stroke-width="2" />
      <circle cx="16" cy="7" r="1.5" fill="#b45309" />
      <!-- Horizontal Busbar -->
      <rect x="2" y="7" width="28" height="3" rx="0.8" fill="#d97706" stroke="#b45309" stroke-width="0.5" />
      <!-- 4 Branch Output Feeds -->
      <line x1="5" y1="10" x2="5" y2="18" stroke="#d97706" stroke-width="1.3" />
      <line x1="12" y1="10" x2="12" y2="18" stroke="#d97706" stroke-width="1.3" />
      <line x1="20" y1="10" x2="20" y2="18" stroke="#d97706" stroke-width="1.3" />
      <line x1="27" y1="10" x2="27" y2="18" stroke="#d97706" stroke-width="1.3" />
      <circle cx="5" cy="18" r="1" fill="#b45309" />
      <circle cx="12" cy="18" r="1" fill="#b45309" />
      <circle cx="20" cy="18" r="1" fill="#b45309" />
      <circle cx="27" cy="18" r="1" fill="#b45309" />
    </g>

    <!-- Circuit description / tag at bottom of faceplate -->
    <text
      x={totalWidth / 2}
      y="102"
      text-anchor="middle"
      font-size="5"
      font-weight="bold"
      fill="#64748b"
      class="truncate select-none font-sans"
    >
      {device.circuitDescription || "Feeder Splitter"}
    </text>
  {:else if def?.typeId === "terminal-dist-1in4out"}
    <!-- 1-IN 4-OUT UNIPOLAR DISTRIBUTION BLOCK (UKK 80A Style) -->
    <!-- Top cavity for incoming 16mm² terminal -->
    <rect x="4" y="2" width="36" height="26" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Bottom tiered cavities for 4 branch terminals -->
    <rect x="4" y="114" width="36" height="20" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />
    <rect x="4" y="136" width="36" height="22" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Center Modular Faceplate Body -->
    <rect
      x="3"
      y="30"
      width={totalWidth - 6}
      height="82"
      rx="3"
      fill="#f8fafc"
      stroke="#cbd5e1"
      stroke-width="1.2"
    />

    <!-- Sky Blue Category Accent Strip -->
    <rect
      x="3"
      y="30"
      width={totalWidth - 6}
      height="4"
      rx="1.5"
      fill={def?.colorAccent || "#0284c7"}
    />

    <!-- Title Badge -->
    <text
      x={totalWidth / 2}
      y="42"
      text-anchor="middle"
      font-size="6"
      font-weight="900"
      fill="#0f172a"
      font-family="system-ui, sans-serif"
    >
      {device.customLabel || "DIST BLOCK"}
    </text>

    <!-- Subtitle Pill: 1-IN 4-OUT -->
    <rect x="6" y="46" width="32" height="9" rx="1.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.5" />
    <text
      x={totalWidth / 2}
      y="52.5"
      text-anchor="middle"
      font-size="4.8"
      font-weight="900"
      fill="#0369a1"
      font-family="monospace"
    >
      1-IN  4-OUT
    </text>

    <!-- Ratings -->
    <text
      x={totalWidth / 2}
      y="61"
      text-anchor="middle"
      font-size="4.5"
      font-weight="bold"
      fill="#64748b"
      font-family="monospace"
    >
      80A 500V~
    </text>

    <!-- Internal Distribution Copper Bus Graphic -->
    <g class="bus-schematic" transform="translate(6, 65)">
      <!-- Main Feed In -->
      <line x1="16" y1="0" x2="16" y2="7" stroke="#d97706" stroke-width="2" />
      <circle cx="16" cy="7" r="1.5" fill="#b45309" />
      <!-- Horizontal Busbar -->
      <rect x="2" y="7" width="28" height="3" rx="0.8" fill="#d97706" stroke="#b45309" stroke-width="0.5" />
      <!-- 4 Branch Output Feeds -->
      <line x1="5" y1="10" x2="5" y2="18" stroke="#d97706" stroke-width="1.3" />
      <line x1="12" y1="10" x2="12" y2="18" stroke="#d97706" stroke-width="1.3" />
      <line x1="20" y1="10" x2="20" y2="18" stroke="#d97706" stroke-width="1.3" />
      <line x1="27" y1="10" x2="27" y2="18" stroke="#d97706" stroke-width="1.3" />
      <circle cx="5" cy="18" r="1" fill="#b45309" />
      <circle cx="12" cy="18" r="1" fill="#b45309" />
      <circle cx="20" cy="18" r="1" fill="#b45309" />
      <circle cx="27" cy="18" r="1" fill="#b45309" />
    </g>

    <!-- Circuit description / tag at bottom of faceplate -->
    <text
      x={totalWidth / 2}
      y="102"
      text-anchor="middle"
      font-size="5"
      font-weight="bold"
      fill="#64748b"
      class="truncate select-none font-sans"
    >
      {device.circuitDescription || "Feeder Splitter"}
    </text>
  {:else}
    <!-- Recessed Front Faceplate (standard 45mm DIN opening) -->
    <rect
      x="3"
      y={heightPx * 0.22}
      width={totalWidth - 6}
      height={heightPx * 0.56}
      rx="3"
      fill="#ffffff"
      stroke="#cbd5e1"
      stroke-width="1"
    />

    <!-- Category Color Accent Strip -->
    <rect
      x="3"
      y={heightPx * 0.22}
      width={totalWidth - 6}
      height="4"
      fill={def?.colorAccent || "#64748b"}
    />

    <!-- Breaker Ratings & Labels / Digital Display -->
    {#if def?.typeId.includes("energy-meter")}
      <!-- Digital Energy Meter with LCD Display -->
      <text
        x={totalWidth / 2}
        y={heightPx * 0.29}
        text-anchor="middle"
        font-size={totalWidth < 50 ? "8" : "9.5"}
        font-weight="bold"
        fill="#0f172a"
        class="font-sans"
      >
        {device.customLabel || def.name.split(" ")[0]}
      </text>

      <text
        x={totalWidth / 2}
        y={heightPx * 0.35}
        text-anchor="middle"
        font-size="6.5"
        fill="#64748b"
        font-family="monospace"
        font-weight="bold"
      >
        230V {def.ratedAmps}A 50/60Hz
      </text>

      <!-- Digital Backlit LCD Panel -->
      {#if device.widthModules >= 2}
        <!-- 2-Module LCD Display -->
        <rect
          x="10"
          y={heightPx * 0.38}
          width={totalWidth - 20}
          height="42"
          rx="3"
          fill="#090d16"
          stroke="#1e293b"
          stroke-width="1.2"
        />
        <rect
          x="12"
          y={heightPx * 0.38 + 2}
          width={totalWidth - 24}
          height="38"
          rx="1.5"
          fill="#022c22"
        />
        <!-- LCD Digits -->
        <text
          x={totalWidth / 2}
          y={heightPx * 0.38 + 13}
          text-anchor="middle"
          font-size="6.5"
          font-family="monospace"
          font-weight="bold"
          fill="#34d399"
        >
          230.2 V   16.4 A
        </text>
        <text
          x={totalWidth / 2}
          y={heightPx * 0.38 + 24}
          text-anchor="middle"
          font-size="6.5"
          font-family="monospace"
          fill="#38bdf8"
        >
          3.78 kW   50.0 Hz
        </text>
        <text
          x={totalWidth / 2}
          y={heightPx * 0.38 + 35}
          text-anchor="middle"
          font-size="7.5"
          font-family="monospace"
          font-weight="900"
          fill="#a7f3d0"
        >
          [001428.6 kWh]
        </text>

        <!-- Controls below LCD -->
        <circle cx="24" cy={heightPx * 0.69} r="2.5" fill="#ef4444" stroke="#991b1b" stroke-width="0.5" />
        <text x="30" y={heightPx * 0.69 + 2} font-size="5" fill="#64748b">Pulse</text>

        <rect x={totalWidth - 34} y={heightPx * 0.66} width="16" height="7" rx="1.5" fill="#334155" stroke="#475569" stroke-width="0.5" />
        <text x={totalWidth - 26} y={heightPx * 0.66 + 5.5} font-size="5" font-weight="bold" fill="#cbd5e1" text-anchor="middle">Set</text>

        <!-- Passthrough Indicator Schematic -->
        <text
          x={totalWidth / 2}
          y={heightPx * 0.74}
          text-anchor="middle"
          font-size="5.5"
          font-weight="bold"
          fill="#059669"
        >
          L1: Metered • L2/N: Pass-thru
        </text>
      {:else}
        <!-- 1-Module Compact LCD Display (18mm 2-Pole Meter) -->
        <rect
          x="4"
          y={heightPx * 0.38}
          width={totalWidth - 8}
          height="40"
          rx="2"
          fill="#090d16"
          stroke="#1e293b"
          stroke-width="1"
        />
        <rect
          x="5"
          y={heightPx * 0.38 + 1.5}
          width={totalWidth - 10}
          height="37"
          rx="1"
          fill="#022c22"
        />
        <text
          x={totalWidth / 2}
          y={heightPx * 0.38 + 11}
          text-anchor="middle"
          font-size="5"
          font-family="monospace"
          font-weight="bold"
          fill="#34d399"
        >
          230V 16A
        </text>
        <text
          x={totalWidth / 2}
          y={heightPx * 0.38 + 20}
          text-anchor="middle"
          font-size="5"
          font-family="monospace"
          fill="#38bdf8"
        >
          3.7 kW
        </text>
        <text
          x={totalWidth / 2}
          y={heightPx * 0.38 + 31}
          text-anchor="middle"
          font-size="5.5"
          font-family="monospace"
          font-weight="bold"
          fill="#a7f3d0"
        >
          01428 kWh
        </text>

        <!-- Pulse indicator and button -->
        <circle cx="12" cy={heightPx * 0.67} r="2" fill="#ef4444" stroke="#991b1b" stroke-width="0.5" />
        <rect x="22" y={heightPx * 0.65} width="11" height="5" rx="1" fill="#334155" stroke="#475569" stroke-width="0.5" />

        <text
          x={totalWidth / 2}
          y={heightPx * 0.74}
          text-anchor="middle"
          font-size="5"
          font-weight="bold"
          fill="#059669"
        >
          L-L / N Pass
        </text>
      {/if}
    {:else if def?.category !== "accessory"}
      <!-- Custom circuit label -->
      <text
        x={totalWidth / 2}
        y={heightPx * 0.32}
        text-anchor="middle"
        font-size={totalWidth < 50 ? "9" : "10"}
        font-weight="bold"
        fill="#0f172a"
        class="font-sans"
      >
        {device.customLabel || def?.name.split(" ")[0]}
      </text>

      <!-- Amperage & Curve Rating (e.g. C20, 63A) -->
      <text
        x={totalWidth / 2}
        y={heightPx * 0.4}
        text-anchor="middle"
        font-size="10"
        font-weight="bold"
        fill="#1e293b"
        class="font-mono"
      >
        {#if device.curve}{device.curve}{/if}{device.ratedAmps
          ? `${device.ratedAmps}A`
          : ""}
      </text>

      <!-- Breaking capacity box [6000] -->
      {#if def?.breakingCapacityKa}
        <rect
          x={totalWidth / 2 - 14}
          y={heightPx * 0.43}
          width="28"
          height="11"
          rx="1"
          fill="none"
          stroke="#64748b"
          stroke-width="0.8"
        />
        <text
          x={totalWidth / 2}
          y={heightPx * 0.43 + 8.5}
          text-anchor="middle"
          font-size="7.5"
          font-family="monospace"
          fill="#475569"
        >
          {def.breakingCapacityKa * 1000}
        </text>
      {/if}

      <!-- Toggle Switch Levers -->
      <g class="toggles" transform="translate(0, {heightPx * 0.54})">
        {#each Array(poles) as _, p}
          {@const poleWidth = totalWidth / poles}
          {@const toggleX = p * poleWidth + poleWidth / 2}
          <!-- Toggle track -->
          <rect
            x={toggleX - 5}
            y="0"
            width="10"
            height="18"
            rx="2"
            fill="#334155"
          />
          <!-- Toggle lever (UP = ON) -->
          <rect
            x={toggleX - 4}
            y="1"
            width="8"
            height="9"
            rx="1"
            fill={def?.colorAccent || "#0284c7"}
            stroke="#0f172a"
            stroke-width="0.5"
          />
        {/each}

        <!-- Handle tie across multiple poles -->
        {#if poles > 1}
          <rect
            x={totalWidth * 0.15}
            y="2"
            width={totalWidth * 0.7}
            height="4"
            rx="1"
            fill="#1e293b"
          />
        {/if}
      </g>

      <!-- RCD / RCBO Test Button -->
      {#if def?.hasTestButton}
        <g
          transform="translate({totalWidth * 0.75}, {heightPx * 0.41})"
          class="test-button"
        >
          <circle r="5" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1" />
          <text
            x="0"
            y="3"
            text-anchor="middle"
            font-size="7"
            font-weight="bold"
            fill="#0284c7"
          >
            T
          </text>
        </g>
      {/if}

      <!-- Trip status indicator window -->
      {#if def?.hasTripWindow}
        <rect
          x={totalWidth * 0.2}
          y={heightPx * 0.47}
          width="8"
          height="4"
          rx="1"
          fill="#dc2626"
          stroke="#64748b"
          stroke-width="0.5"
        />
      {/if}

      <!-- Circuit description at bottom of faceplate -->
      <text
        x={totalWidth / 2}
        y={heightPx * 0.73}
        text-anchor="middle"
        font-size="7.5"
        fill="#64748b"
        class="truncate select-none"
      >
        {device.circuitDescription
          ? device.circuitDescription.length > 14
            ? device.circuitDescription.substring(0, 12) + ".."
            : device.circuitDescription
          : ""}
      </text>
    {:else}
      <!-- Blanking Plate pattern -->
      {#each Array(4) as _, b}
        <line
          x1={totalWidth * 0.2}
          y1={heightPx * (0.35 + b * 0.1)}
          x2={totalWidth * 0.8}
          y2={heightPx * (0.35 + b * 0.1)}
          stroke="#cbd5e1"
          stroke-width="1.5"
        />
      {/each}
    {/if}
  {/if}

  <!-- TOP TERMINALS -->
  {#each topTerminals as term}
    {@const termX = term.slotOffset * moduleWidthPx}
    {@const termY = term.yOffset !== undefined ? term.yOffset : 12}
    <g
      class="terminal terminal-top cursor-pointer group"
      transform="translate({termX}, {termY})"
      onmousedown={(e) => handleTerminalClick(term, e)}
      onmouseup={(e) => handleTerminalRelease(term, e)}
      onclick={(e) => e.stopPropagation()}
      role="button"
      tabindex="0"
    >
      <!-- Generous invisible hit area -->
      <circle r="14" fill="transparent" />
      <title>{term.label}</title>

      <!-- Screw / Terminal Housing -->
      <circle
        r={def?.category === "ats" && term.id.startsWith("SIG") ? 4 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? 5.5 : 8)}
        fill="#e2e8f0"
        stroke="#64748b"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG")
          ? 1
          : 1.5}
        class="transition-all group-hover:stroke-blue-500 group-hover:scale-125"
      />
      <!-- Screw Slot -->
      <line
        x1={def?.category === "ats" && term.id.startsWith("SIG") ? -2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? -2.5 : -4)}
        y1={def?.category === "ats" && term.id.startsWith("SIG") ? -2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? -2 : -3)}
        x2={def?.category === "ats" && term.id.startsWith("SIG") ? 2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? 2.5 : 4)}
        y2={def?.category === "ats" && term.id.startsWith("SIG") ? 2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && topTerminals.length > 1) ? 2 : 3)}
        stroke="#475569"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG")
          ? 1
          : 1.5}
      />

      <!-- Interactive Click Dot -->
      <circle
        r="4"
        fill="#3b82f6"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <!-- Terminal Label -->
      {#if def?.typeId !== 'mts-2p-63a'}
        <text
          x="0"
          y={def?.category === "ats" ? (term.id.startsWith("SIG") ? 12 : 16) : 18}
          text-anchor="middle"
          font-size={device.widthModules === 1 && topTerminals.length > 1 ? "5.5" : (def?.category === "ats" ? "6.5" : "7")}
          font-weight="bold"
          fill="#475569"
        >
          {term.label}
        </text>
      {/if}
    </g>
  {/each}

  <!-- BOTTOM TERMINALS -->
  {#each bottomTerminals as term}
    {@const termX = term.slotOffset * moduleWidthPx}
    {@const termY = term.yOffset !== undefined ? term.yOffset : heightPx - 14}
    <g
      class="terminal terminal-bottom cursor-pointer group"
      transform="translate({termX}, {termY})"
      onmousedown={(e) => handleTerminalClick(term, e)}
      onmouseup={(e) => handleTerminalRelease(term, e)}
      onclick={(e) => e.stopPropagation()}
      role="button"
      tabindex="0"
    >
      <!-- Generous invisible hit area -->
      <circle r="14" fill="transparent" />
      <title>{term.label}</title>

      <!-- Terminal Label -->
      {#if def?.typeId !== 'mts-2p-63a'}
        <text
          x="0"
          y={def?.category === "ats"
            ? term.id.startsWith("SIG")
              ? -7
              : -9
            : (def?.typeId === 'terminal-dist-1in4out' ? -7 : -10)}
          text-anchor="middle"
          font-size={def?.typeId === 'terminal-dist-1in4out' ? "4.8" : (device.widthModules === 1 && bottomTerminals.length > 1 ? "5.5" : (def?.category === "ats" ? "6.5" : "7"))}
          font-weight="bold"
          fill="#475569"
        >
          {term.label}
        </text>
      {/if}

      <!-- Screw / Terminal Housing -->
      <circle
        r={def?.category === "ats" && term.id.startsWith("SIG") ? 4 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? 5.5 : 8)}
        fill="#e2e8f0"
        stroke="#64748b"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG")
          ? 1
          : 1.5}
        class="transition-all group-hover:stroke-blue-500 group-hover:scale-125"
      />
      <!-- Screw Slot -->
      <line
        x1={def?.category === "ats" && term.id.startsWith("SIG") ? -2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? -2.5 : -4)}
        y1={def?.category === "ats" && term.id.startsWith("SIG") ? -2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? -2 : -3)}
        x2={def?.category === "ats" && term.id.startsWith("SIG") ? 2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? 2.5 : 4)}
        y2={def?.category === "ats" && term.id.startsWith("SIG") ? 2 : (def?.typeId === 'mts-2p-63a' || (device.widthModules === 1 && bottomTerminals.length > 1) ? 2 : 3)}
        stroke="#475569"
        stroke-width={def?.category === "ats" && term.id.startsWith("SIG")
          ? 1
          : 1.5}
      />

      <!-- Interactive Click Dot -->
      <circle
        r="4"
        fill="#3b82f6"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </g>
  {/each}
</g>
