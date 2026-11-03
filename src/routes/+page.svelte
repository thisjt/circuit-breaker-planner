<script lang="ts">
  import Toolbar from '#lib/components/Toolbar.svelte';
  import SidebarCatalog from '#lib/components/SidebarCatalog.svelte';
  import Canvas from '#lib/components/Canvas.svelte';
  import Inspector from '#lib/components/Inspector.svelte';
  import BomModal from '#lib/components/BomModal.svelte';
  import LabelStripModal from '#lib/components/LabelStripModal.svelte';
  import DrcModal from '#lib/components/DrcModal.svelte';
  import { panelStore } from '#lib/state.svelte';

  let isBOMOpen = $state(false);
  let isLabelsOpen = $state(false);
  let isDRCOpen = $state(false);

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isEditingText =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT';

    if (isEditingText) return;

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
  />

  <!-- Main Workspace Area -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left DIN Breakers Catalog -->
    <SidebarCatalog />

    <!-- Center Interactive DIN Rail Canvas -->
    <main class="flex-1 h-full relative">
      <Canvas />
    </main>

    <!-- Right Properties & Inspector Panel -->
    <Inspector />
  </div>

  <!-- Modals -->
  <BomModal isOpen={isBOMOpen} onClose={() => (isBOMOpen = false)} />
  <LabelStripModal isOpen={isLabelsOpen} onClose={() => (isLabelsOpen = false)} />
  <DrcModal isOpen={isDRCOpen} onClose={() => (isDRCOpen = false)} />
</div>
