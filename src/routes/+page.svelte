<script lang="ts">
  import Toolbar from '#lib/components/Toolbar.svelte';
  import SidebarCatalog from '#lib/components/SidebarCatalog.svelte';
  import Canvas from '#lib/components/Canvas.svelte';
  import Inspector from '#lib/components/Inspector.svelte';
  import BomModal from '#lib/components/BomModal.svelte';
  import LabelStripModal from '#lib/components/LabelStripModal.svelte';
  import DrcModal from '#lib/components/DrcModal.svelte';
  import { panelStore } from '#lib/state.svelte';
  import {
    PanelLeftOpen,
    PanelRightOpen,
    ChevronRight,
    ChevronLeft,
  } from '@lucide/svelte';

  const SIDEBAR_STORAGE_KEY = 'cb_planner_ui_sidebars_v1';

  function loadSidebarPrefs(): { left: boolean; right: boolean } {
    if (typeof window === 'undefined') return { left: true, right: true };
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          left: typeof parsed.left === 'boolean' ? parsed.left : true,
          right: typeof parsed.right === 'boolean' ? parsed.right : true,
        };
      }
    } catch (e) {
      console.warn('Failed to load sidebar visibility state:', e);
    }
    return { left: true, right: true };
  }

  const initialSidebars = loadSidebarPrefs();

  let isBOMOpen = $state(false);
  let isLabelsOpen = $state(false);
  let isDRCOpen = $state(false);
  let isLeftSidebarOpen = $state(initialSidebars.left);
  let isRightSidebarOpen = $state(initialSidebars.right);

  function saveSidebarPrefs() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify({ left: isLeftSidebarOpen, right: isRightSidebarOpen })
      );
    } catch (e) {
      console.warn('Failed to save sidebar visibility state:', e);
    }
  }

  function toggleLeftSidebar() {
    isLeftSidebarOpen = !isLeftSidebarOpen;
    saveSidebarPrefs();
  }

  function toggleRightSidebar() {
    isRightSidebarOpen = !isRightSidebarOpen;
    saveSidebarPrefs();
  }

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isEditingText =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT';

    if (isEditingText) return;

    // Sidebar Toggle Shortcuts: [ for Left Library, ] for Right Inspector, \ for Both
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === '[') {
        e.preventDefault();
        toggleLeftSidebar();
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        toggleRightSidebar();
        return;
      }
      if (e.key === '\\') {
        e.preventDefault();
        const shouldOpen = !isLeftSidebarOpen && !isRightSidebarOpen;
        isLeftSidebarOpen = shouldOpen;
        isRightSidebarOpen = shouldOpen;
        saveSidebarPrefs();
        return;
      }
    }

    // Undo / Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        panelStore.redo();
      } else {
        panelStore.undo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      panelStore.redo();
    }

    // Delete selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (panelStore.selectedType === 'device' && panelStore.selectedId) {
        panelStore.removeDevice(panelStore.selectedId);
      } else if (panelStore.selectedType === 'wire' && panelStore.selectedId) {
        panelStore.removeWire(panelStore.selectedId);
      } else if (panelStore.selectedType === 'busbar' && panelStore.selectedId) {
        panelStore.removeBusbar(panelStore.selectedId);
      } else if ((panelStore.selectedType === 'field_block' || panelStore.selectedType === 'equipment') && panelStore.selectedId) {
        panelStore.removeEquipment(panelStore.selectedId);
      }
    }

    // Escape
    if (e.key === 'Escape') {
      if (panelStore.wireDraft) {
        panelStore.cancelWireDraft();
      } else {
        panelStore.clearSelection();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
  <title>Circuit Breaker & Panel Wire Planner</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 font-sans">
  <!-- Top Navigation & Controls Toolbar -->
  <Toolbar
    onOpenBOM={() => (isBOMOpen = true)}
    onOpenLabels={() => (isLabelsOpen = true)}
    onOpenDRC={() => (isDRCOpen = true)}
    {isLeftSidebarOpen}
    {isRightSidebarOpen}
    onToggleLeftSidebar={toggleLeftSidebar}
    onToggleRightSidebar={toggleRightSidebar}
  />

  <!-- Main Workspace Area -->
  <div class="flex-1 flex overflow-hidden relative">
    <!-- Left DIN Breakers & Equipment Catalog -->
    {#if isLeftSidebarOpen}
      <SidebarCatalog onCollapse={toggleLeftSidebar} />
    {/if}

    <!-- Center Interactive DIN Rail Canvas -->
    <main class="flex-1 h-full relative">
      <Canvas />

      <!-- Floating Left Edge Reopen Tab (When Left Sidebar is Collapsed) -->
      {#if !isLeftSidebarOpen}
        <button
          type="button"
          class="absolute left-0 top-3 z-20 flex items-center gap-1.5 pl-2.5 pr-3 py-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-blue-400 border border-l-0 border-slate-700 rounded-r-xl shadow-xl transition cursor-pointer group"
          onclick={toggleLeftSidebar}
          title="Open Component Library ([)"
        >
          <PanelLeftOpen class="w-4 h-4 text-blue-400" />
          <span class="text-xs font-semibold">Library</span>
          <ChevronRight class="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      {/if}

      <!-- Floating Right Edge Reopen Tab (When Right Sidebar is Collapsed) -->
      {#if !isRightSidebarOpen}
        <button
          type="button"
          class="absolute right-0 top-3 z-20 flex items-center gap-1.5 pl-3 pr-2.5 py-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-blue-400 border border-r-0 border-slate-700 rounded-l-xl shadow-xl transition cursor-pointer group"
          onclick={toggleRightSidebar}
          title="Open Inspector Panel (])"
        >
          <ChevronLeft class="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span class="text-xs font-semibold">Inspector</span>
          <PanelRightOpen class="w-4 h-4 text-blue-400" />
        </button>
      {/if}
    </main>

    <!-- Right Properties & Inspector Panel -->
    {#if isRightSidebarOpen}
      <Inspector onCollapse={toggleRightSidebar} />
    {/if}
  </div>

  <!-- Modals -->
  <BomModal isOpen={isBOMOpen} onClose={() => (isBOMOpen = false)} />
  <LabelStripModal isOpen={isLabelsOpen} onClose={() => (isLabelsOpen = false)} />
  <DrcModal isOpen={isDRCOpen} onClose={() => (isDRCOpen = false)} />
</div>
