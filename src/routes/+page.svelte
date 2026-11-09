<script lang="ts">
  import { onMount } from 'svelte';
  import Toolbar from '#lib/components/Toolbar.svelte';
  import SidebarCatalog from '#lib/components/SidebarCatalog.svelte';
  import Canvas from '#lib/components/Canvas.svelte';
  import Inspector from '#lib/components/Inspector.svelte';
  import BomModal from '#lib/components/BomModal.svelte';
  import LabelStripModal from '#lib/components/LabelStripModal.svelte';
  import DrcModal from '#lib/components/DrcModal.svelte';
  import FileModals, { type FileModalMode } from '#lib/components/FileModals.svelte';
  import PrintDiagramModal from '#lib/components/PrintDiagramModal.svelte';
  import { getSerializedDiagramSvg } from '#lib/svgExport';
  import { panelStore } from '#lib/state.svelte';
  import {
    PanelLeftOpen,
    PanelRightOpen,
    ChevronRight,
    ChevronLeft,
    CheckCircle2
  } from '@lucide/svelte';

  interface Props {
    initialPlanId?: string | null;
  }

  let { initialPlanId = null }: Props = $props();

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
  let isPrintDiagramOpen = $state(false);
  let fileModalMode = $state<FileModalMode>(null);
  let incomingPlanId = $state<string | null>(null);
  let toastMessage = $state<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  let isLeftSidebarOpen = $state(initialSidebars.left);
  let isRightSidebarOpen = $state(initialSidebars.right);

  function showToast(msg: string) {
    toastMessage = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = null;
    }, 3200);
  }

  onMount(() => {
    const routePlanId =
      initialPlanId ||
      (window.location.pathname.startsWith('/plan/')
        ? window.location.pathname.replace(/^\/plan\//, '').split('/')[0]
        : null);

    if (routePlanId) {
      incomingPlanId = routePlanId;
      fileModalMode = 'incoming_shared';
    }
  });

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

  async function handleQuickSave() {
    panelStore.saveToLocalStorage(false);
    if (panelStore.cloudPlanId && panelStore.canEditCurrentPlan) {
      try {
        const res = await panelStore.saveToCloud(false);
        showToast(`Saved to cloud (/plan/${res.id})`);
      } catch (e: any) {
        showToast(e?.message || 'Could not overwrite plan');
        fileModalMode = 'save_as';
      }
    } else {
      fileModalMode = 'save_as';
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isEditingText =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT';

    // File Menu Shortcuts (work even if focus is in an input when Ctrl/Cmd is held)
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          fileModalMode = 'save_as';
        } else {
          handleQuickSave();
        }
        return;
      }
      if (key === 'o') {
        e.preventDefault();
        fileModalMode = 'open';
        return;
      }
      if (key === 'p') {
        e.preventDefault();
        isPrintDiagramOpen = true;
        return;
      }
      if (key === 'n' && !isEditingText) {
        e.preventDefault();
        fileModalMode = 'new';
        return;
      }
    }

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
      if (fileModalMode) {
        fileModalMode = null;
      } else if (isPrintDiagramOpen) {
        isPrintDiagramOpen = false;
      } else if (panelStore.wireDraft) {
        panelStore.cancelWireDraft();
      } else {
        panelStore.clearSelection();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
  <title>{panelStore.projectTitle ? `${panelStore.projectTitle} — Circuit Breaker Planner` : 'Circuit Breaker & Panel Wire Planner'}</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 font-sans">
  <!-- Top Navigation & Controls Toolbar -->
  <Toolbar
    onOpenBOM={() => (isBOMOpen = true)}
    onOpenLabels={() => (isLabelsOpen = true)}
    onOpenDRC={() => (isDRCOpen = true)}
    onOpenFileModal={(m) => (fileModalMode = m)}
    onOpenPrintDiagram={() => (isPrintDiagramOpen = true)}
    onQuickSave={handleQuickSave}
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

      <!-- Floating Toast Notification -->
      {#if toastMessage}
        <div
          class="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/60 text-slate-100 text-xs font-semibold shadow-2xl"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
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
  <FileModals
    mode={fileModalMode}
    {incomingPlanId}
    onClose={() => (fileModalMode = null)}
    onNotify={showToast}
  />
  <PrintDiagramModal
    isOpen={isPrintDiagramOpen}
    onClose={() => (isPrintDiagramOpen = false)}
    {getSerializedDiagramSvg}
  />
</div>
