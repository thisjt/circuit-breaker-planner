# Circuit Breaker & Panel Wire Planner

An interactive web CAD application for planning DIN rail distribution boards (consumer units / breaker panels), component layout, manual comb busbars, terminal-to-terminal wiring schedules, and automated electrical design rule checking.

Built with **SvelteKit (Svelte 5 Runes)**, **TypeScript**, **Tailwind CSS**, and deployable to **Cloudflare Pages / Workers**.

---

## ⚡ Features

- **Interactive DIN Rail Enclosure**:
  - Configurable DIN tiers (1 to 6 rows) and modular slot widths ($1\text{ TE} = 18\text{ mm}$).
  - Quick enclosure presets (1-Row 12M, 2-Row 24M, 3-Row 36M, 4-Row 48M).
  - Top Ground (PE) and bottom Neutral (N) brass busbar terminals.
  - Infinite vector zoom, pan, and alignment guides.
- **Parametric Component Library**:
  - Double & 4-Pole Main Incomer Switches / Isolators (63A, 100A).
  - RCDs / RCCBs (40A, 63A with 30mA trip & test buttons).
  - RCBOs (Compact 1P+N 1-module and standard 2-module).
  - Miniature Circuit Breakers (MCBs: 1P, 2P, 3P with B/C/D curves and 6A–63A ratings).
  - Type 2 Surge Protection Devices (SPDs).
  - Feed-through & 1-in 4-out Unipolar Distribution blocks (UKK 80A style).
  - **Detached Field Connection Blocks** (Freestanding off-rail junction blocks for source feeds and branch loads like "From House", "To Airconditioner", with customizable labels, top/bottom terminal flip, and arbitrary canvas placement).
  - Smart DIN Relays (Shelly) & Digital Multifunction Energy Meters (1P and 2P 2-In / 2-Out with Neutral/L2 Passthrough).
  - Transfer Switches: Dual Power Automatic Transfer Switches (ATS 100A, 6-module) & Manual Transfer Switches (MTS Taxnele TX219G 63A 400V, 2-module 3-position I-0-II changeover).
  - Blanking plates.
- **Wiring & Interconnection Engine**:
  - Interactive terminal click-to-connect rubber-band drafting.
  - **Philippine Electrical Code (PEC) Default Palette**:
    - Single-Phase 230V: Line 1 (Black), Line 2 / Neutral (Red or White), Ground (Green).
    - Three-Phase 230V/400V: Black (A), Red (B), Blue (C), White (N), Green (Ground).
  - Selectable **IEC 60446 European Standard**: Brown, Black, Grey, Blue, Green/Yellow.
  - Wire cross-section sizing ($1.5\text{ mm}^2$ up to $25\text{ mm}^2$ / AWG) with proportional visual thickness.
  - Curved (Bezier) and Orthogonal duct routing modes.
- **Manual Comb Busbar Placement**:
  - Interactive manual placement tool across top or bottom breaker terminals (1P, 1P+N, 2P, 3P comb bars).
- **Design Rule Checking (DRC)**:
  - Wire gauge vs. upstream breaker ampacity mismatch warnings.
  - Direct short-circuit detection (Phase to Neutral/Ground link without load).
  - Rail capacity overfill warning.
  - Overcrowded terminal clamp warnings (> 2 conductors).
- **Persistence, BOM & Exports**:
  - Offline-first automatic saving to `localStorage`.
  - JSON schema project export and import.
  - Vector SVG export.
  - Printable **18mm Panel Faceplate Label Stickers** view.
  - Bill of Materials (BOM) & Wire Schedule cut-list CSV export.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on v22)
- `pnpm` (or `npm`)

### Development Server
Start the local development server:

```sh
pnpm dev --port 5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view and interact with the application.

### Type Checking
```sh
pnpm check
```

### Production Build (Cloudflare Pages)
```sh
pnpm build
```

To preview the production bundle locally:
```sh
pnpm preview
```
