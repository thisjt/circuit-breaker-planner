# Circuit Breaker & Panel Wire Planner — Project Requirements Document

## 1. Project Overview

### 1.1 Summary
The **Circuit Breaker & Panel Wire Planner** is a client-side web application designed to help electricians, electrical engineers, panel builders, and DIY enthusiasts visually lay out electrical distribution boards (consumer units / breaker panels) and plan the wiring interconnections between components.

Users can define panel specifications (DIN rails, rows, and module widths), drag and drop modular DIN rail equipment, interactively route wires between terminals with proper phase color coding and gauges, manually place comb busbars, and export complete panel schedules, bills of materials (BOM), and wiring diagrams.

### 1.2 Target Audience
- **Electricians & Panel Builders**: Planning distribution boards before assembly, generating wiring cut-lists and panel schedules.
- **Solar & EV Installers**: Sizing and laying out combiner boxes and sub-panels.
- **Home Lab / Automation Enthusiasts**: Planning smart relays (Shelly/Sonoff), DIN rail power supplies, and control panels.
- **DIYers / Students**: Understanding consumer unit hierarchy and electrical safety.

---

## 2. Tech Stack & Architecture

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (using Svelte 5 runes for reactive state management).
- **Hosting / Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) / Cloudflare Pages via `@sveltejs/adapter-cloudflare`.
- **Styling**: Tailwind CSS + UI components (e.g., bits-ui / Lucide Icons).
- **Canvas / Rendering Engine**: Interactive SVG (Scalable Vector Graphics) for crisp rendering, infinite zoom, responsive terminal hitboxes, and print-ready vector export.
- **Data Persistence**:
  - `localStorage` and `IndexedDB` for offline-first project autosave.
  - JSON Schema-based file import/export.
- **Offline Capabilities**: Full client-side functionality; works offline without server round-trips.

---

## 3. Functional Requirements

### 3.1 Panel & DIN Rail Enclosure Setup
1. **Enclosure Sizing**:
   - Number of horizontal DIN rail tiers/rows (e.g., 1 to 6 rows).
   - Module width per rail, measured in standard DIN units (**1 TE / Module = 18 mm**; typical panels range from 4 to 24 modules per row).
   - Configurable DIN rail vertical spacing / distance between rails (180px–380px, adjusting wire gutter clearance from compact domestic boxes to deep industrial enclosures).
   - Presets for common consumer units (e.g., 1-Row 8M/12M, 2-Row 24M, 3-Row 36M, 4-Row 48M, custom).
2. **Wire Gutters & Accessories**:
   - Configurable wiring gutters (top, bottom, and side duct spacing).
   - Top/Bottom grounding (PE) and neutral (N) terminal brass busbar strips.
   - Enclosure cover view toggle (shows cutout window and dead-front panel labels).

### 3.2 Modular Component Library
The application provides a library of DIN rail-mountable devices with accurate module widths (TE) and terminal connection points.

#### Built-in Device Types:
| Category | Device Examples | Width (TE) | Typical Terminals |
| :--- | :--- | :--- | :--- |
| **Main Switches** | 2-Pole / 4-Pole Isolator (63A, 100A) | 2M / 4M | In: L1, L2, L3, N; Out: L1, L2, L3, N |
| **RCD / RCCB** | 2-Pole / 4-Pole (30mA, 100mA, 300mA Type A/AC/B) | 2M / 4M | Line In, Neutral In, Line Out, Neutral Out |
| **MCB** | 1-Pole, 2-Pole, 3-Pole (B, C, D curves; 6A–63A) | 1M, 2M, 3M | Top (Line In), Bottom (Line Out) |
| **RCBO** | Compact 1-Pole+N (1M) or Standard 2-Pole (2M) | 1M / 2M | Line/Neutral In, Line/Neutral Out, Functional Earth |
| **Surge Protection** | Type 2 / Type 1+2 SPD (1P+N, 3P+N) | 1M–4M | L1, L2, L3, N, Earth |
| **Terminal Blocks** | WAGO DIN mounts, 1-in 4-out distribution blocks | 0.5M–2M | Multiple grouped in/out terminals |
| **Smart / Aux Devices** | Energy Meters (MID), Shelly DIN relays, Contactors, Bell Transformers | 1M–3M | Control terminals (A1/A2), CT clamp inputs, load terminals |
| **Transfer Switches (ATS)** | Dual Power Automatic Transfer Switch (ATS-GQ2-2P, 100A 220V) | 6M | Top: Main Power In (L, N); Bottom Tier 1: Standby Power (L, N); Bottom Tier 2: ATS Output (L, N); Aux Signals (AR, AN, BR, BN) |
| **Accessories** | Blanking plates, Rail separators/dividers | 0.5M, 1M | No terminals (spacers) |

#### Device Visual Representation & Properties:
- **Visual Footprint**: Standardized parametric 2D DIN box representations rendered dynamically from device width (TE), toggle switches, rating text, and terminal pin locations. *(Note: Custom external SVG footprint imports are deferred to future releases).*
- **Identifier & Label**: Custom name (e.g., `Q1`, `MCB-1`), circuit description (e.g., "Kitchen Sockets"), room/zone.
- **Electrical Specs**: Rated current ($I_n$ in Amperes), tripping curve, breaking capacity (kA), rated voltage.
- **Terminal Layout**:
  - Exact coordinates of terminals (Top and Bottom rows).
  - Terminal type: Screw clamp, cage clamp, or busbar comb slot.
- **Custom Device Creator**: Allow users to define custom modular devices by setting module width (TE), body color, and terminal positions/labels.

### 3.3 Canvas Layout & Interaction
1. **DIN Rail Snapping**:
   - Devices snap to integer module positions (or 0.5 TE half-module slots).
   - Collision detection prevents overlapping devices on the same rail.
   - Drag-to-reorder: dragging a breaker moves neighboring breakers when space permits.
2. **Canvas Controls**:
   - Pan and smooth zoom (mouse wheel, pinch-to-zoom, zoom buttons, reset view).
   - Grid and alignment guidelines.
   - Selection tool: select individual devices or marquee-select multiple devices to move between rails.
   - Quick actions: Duplicate device, rotate top/bottom (if applicable), delete.

### 3.4 Wiring & Interconnection Engine
1. **Point-to-Point Wiring**:
   - Click/drag from a source terminal to a target terminal to create a connection.
   - Visual terminal connection indicators (green dot when terminal accepts connection, red if invalid).
2. **Wire Standards & Color Coding**:
   - **Default: Philippine Electrical Code (PEC) / NEC Standard**:
     - *Single-Phase 230V Systems*:
       - Line 1 (L1 / Hot): **Black**
       - Line 2 / Neutral: **Red** (for traditional 230V 2-wire ungrounded delta systems common in the Philippines) or **White** (for 230V Line-to-Neutral grounded systems)
       - Ground / Earth (PE): **Green** or **Green with Yellow stripe**
     - *Three-Phase Systems (230V Delta or 400V Wye)*:
       - Phase A (L1): **Black**
       - Phase B (L2): **Red**
       - Phase C (L3): **Blue**
       - Neutral (N): **White** / Light Gray
       - Ground / Earth (PE): **Green** or **Green/Yellow**
   - **Selectable Alternative: IEC 60446 / European Standard**:
     - Line 1 (L / L1): **Brown**
     - Line 2 (L2): **Black**
     - Line 3 (L3): **Grey**
     - Neutral (N): **Blue**
     - Protective Earth (PE): **Green/Yellow**
   - Custom wire color picker for DC, signal, and automation lines.
   - **Wire Cross-Section / Gauge**:
     - Metric cross-section ($mm^2$): $1.5\text{ mm}^2$, $2.5\text{ mm}^2$, $4\text{ mm}^2$, $6\text{ mm}^2$, $10\text{ mm}^2$, $16\text{ mm}^2$, $25\text{ mm}^2$.
     - AWG equivalent display option (e.g., 14 AWG, 12 AWG, 10 AWG, 8 AWG, 6 AWG, 4 AWG).
     - Visual thickness on canvas proportionally scales with wire gauge.
3. **Busbar Simulation (Manual Placement)**:
   - Comb busbars are **placed manually** by the user (not automatically routed):
     - User selects comb busbar type: 1-Phase (1P), 1P+N, 2-Phase (2P), or 3-Phase (3P) comb busbar.
     - User designates terminal position: Top or Bottom terminal row.
     - User clicks or drags to define the span (starting breaker module to ending breaker module).
   - Visual representation of the insulated busbar housing and metal prongs inserted into connected breaker terminals.
   - Design check ensures the busbar type matches the breaker terminal configuration across the spanned width.
4. **Wire Routing Visualization**:
   - **Orthogonal / Gutter Routing**: Wires route through peripheral wiring ducts and gutters cleanly.
   - **Curved (Bezier) Routing**: Direct, readable curved paths for quick schematic reading.
   - Terminal capacity indicator: Displays count of wires connected to a single terminal (e.g., alert if $>2$ wires in a single clamp).

### 3.5 Design Rules & Validation Checks (DRC)
An automated rule-checker flags common electrical design errors:
- **Overcurrent Protection Mismatch**: Warning if a wire's current-carrying capacity is lower than the upstream breaker's rating (e.g., $1.5\text{ mm}^2$ wire on a 32A breaker).
- **Direct Short Circuit Warning**: Alert if Line (L) and Neutral (N) or PE are linked directly without a load/device.
- **RCD Neutral Mismatch**: Alert if circuit neutral bypasses the protecting RCD neutral bar.
- **Rail Capacity Overfill**: Warning when placed devices exceed rail module capacity.
- **Unconnected Terminals Notification**: Highlighting unused or incomplete circuits.

---

## 4. Import, Export & Reporting

### 4.1 Project Persistence
- **Autosave**: Automatically saves current state to browser `localStorage` or `IndexedDB`.
- **Project Manager**: Save, duplicate, rename, and switch between multiple panel projects.

### 4.2 File Import & Export
- **JSON File Format**:
  - Full project schema export (`.json` or `.cbp` file).
  - Versioned schema for backward compatibility.
  - Complete structure: panel geometry, device instances, terminal assignments, and wire routes.
- **Diagram Exports**:
  - **SVG**: Vector graphic suitable for documentation and CAD embedding.
  - **PDF**: Printable high-resolution technical drawing with title block, legend, and date.
  - **PNG**: High-DPI raster image for quick sharing.

### 4.3 Schedules & Documentation Outputs
- **Bill of Materials (BOM)**:
  - Table of all modules, types, manufacturer model placeholders, quantities, and module count.
  - CSV export for procurement.
- **Wiring Schedule / Cut List**:
  - List of all connections: Source Terminal -> Destination Terminal, Wire Gauge, Color, Approximate Length.
- **Printable Panel Faceplate Labels**:
  - Standard 18mm-wide strip labels with breaker names, circuit numbers, and icons to stick onto the enclosure front cover.

---

## 5. Non-Functional Requirements

- **Performance**: High frame rate (60 fps) canvas interactions, smooth drag-and-drop, and sub-100ms wire re-routing for panels up to 100+ modules and 200+ wires.
- **Responsive & Accessible**: Optimized for desktop browsers (Chrome, Firefox, Safari, Edge) with touch/stylus support on tablets (iPad/Surface).
- **Zero Server Dependency**: 100% of the simulation and file generation runs client-side, ensuring data privacy and zero hosting operational cost.
- **Intuitive UX**:
  - Standard keyboard shortcuts: `Ctrl+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo), `Del` (Delete selected), `Space + Drag` (Canvas Pan), `Esc` (Cancel wire draw).
  - Light and Dark modes.

---

## 6. Implementation Milestones

- [ ] **Phase 1: Project Setup & Canvas Core**
  - SvelteKit + Cloudflare adapter setup.
  - SVG Canvas with Pan/Zoom and DIN rail rendering.
  - Basic panel dimension configuration modal (rows × slots).
- [ ] **Phase 2: Component Library & Placement**
  - Pre-defined device catalog (MCBs, RCDs, RCBOs, Isolators, Terminal blocks).
  - Parametric 2D DIN box renderer (width TE, terminal pins, ratings).
  - Drag-and-drop snapping onto rails with collision detection.
  - Selection, moving, and deletion.
- [ ] **Phase 3: Wiring & Busbar System**
  - Interactive terminal click-to-connect wiring.
  - Color standard selector (Default: Philippine Electrical Code / PEC, with IEC toggle).
  - Wire cross-section / gauge selection ($1.5\text{ mm}^2$ to $25\text{ mm}^2$ / AWG).
  - Manual comb busbar placement tool (1P, 1P+N, 2P, 3P).
  - Basic routing and wire rendering.
- [ ] **Phase 4: Persistence & Import/Export**
  - LocalStorage autosave.
  - JSON project import/export.
  - SVG and PNG export.
- [ ] **Phase 5: Electrical Validation & Schedules**
  - Design rule validation engine (wire gauge check, short circuit warnings).
  - Bill of Materials (BOM) & Wiring Schedule CSV/table export.
  - Panel front label strip generator.
