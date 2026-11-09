<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let { totalWidth }: Props = $props();
</script>

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
  <circle cx="5" cy="4" r="1.5" fill="none" stroke="#0f172a" stroke-width="0.7" />
  <text x="5" y="2" font-size="4" fill="#0f172a" text-anchor="middle">1</text>
  <circle cx="25" cy="4" r="1.5" fill="none" stroke="#0f172a" stroke-width="0.7" />
  <text x="25" y="2" font-size="4" fill="#0f172a" text-anchor="middle">5</text>

  <line x1="5" y1="5.5" x2="4" y2="12" stroke="#0f172a" stroke-width="0.8" />
  <line x1="25" y1="5.5" x2="24" y2="12" stroke="#0f172a" stroke-width="0.8" />
  <line x1="5" y1="9" x2="25" y2="9" stroke="#0f172a" stroke-width="0.6" stroke-dasharray="1.5,1.5" />

  <text x="1" y="9.5" font-size="4" font-weight="bold" fill="#0f172a">I</text>
  <text x="31" y="9.5" font-size="4" font-weight="bold" fill="#0f172a">II</text>

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
<rect x="4" y="80" width="80" height="10" rx="2" fill="#f8fafc" stroke="#64748b" stroke-width="1" />
<!-- Center Grip Clip -->
<rect x="34" y="79" width="20" height="12" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />
<line x1="41" y1="81" x2="41" y2="89" stroke="#cbd5e1" stroke-width="0.8" />
<line x1="44" y1="81" x2="44" y2="89" stroke="#cbd5e1" stroke-width="0.8" />
<line x1="47" y1="81" x2="47" y2="89" stroke="#cbd5e1" stroke-width="0.8" />

<!-- Center vertical dividing seam on bottom faceplate -->
<line x1="44" y1="105" x2="44" y2="125" stroke="#cbd5e1" stroke-width="1" />

