<script lang="ts">
  import { panelStore } from '#lib/state.svelte';
  import type { CloudPlanSummary } from '#lib/types';
  import {
    FilePlus,
    FolderOpen,
    Save,
    Share2,
    Cloud,
    HardDrive,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Download,
    Upload,
    X,
    ExternalLink,
    Sparkles,
    LayoutGrid,
    AlertCircle,
    User,
    FileText,
    Lock,
    Unlock,
    KeyRound,
    ShieldCheck
  } from '@lucide/svelte';

  export type FileModalMode =
    | 'new'
    | 'open'
    | 'save_as'
    | 'share'
    | 'incoming_shared'
    | 'unlock'
    | null;

  interface Props {
    mode: FileModalMode;
    incomingPlanId?: string | null;
    onClose: () => void;
    onNotify?: (message: string) => void;
  }

  let { mode, incomingPlanId = null, onClose, onNotify }: Props = $props();

  // New Project state
  let newTitle = $state('Residential Distribution Plan');
  let newAuthor = $state('');
  let newTemplateMode = $state<'blank' | 'template'>('blank');

  // Open Modal state
  let openTab = $state<'cloud' | 'local'>('cloud');
  let cloudPlans = $state<CloudPlanSummary[]>([]);
  let isLoadingCloudList = $state(false);
  let cloudError = $state<string | null>(null);
  let cloudSearch = $state('');
  let directPlanInput = $state('');
  let localFileInput: HTMLInputElement | null = $state(null);

  // Save As / Share state
  let editTitle = $state('');
  let editAuthor = $state('');
  let editPassphrase = $state('');
  let removePassphrase = $state(false);
  let copiedId = $state<string | null>(null);
  let shareError = $state<string | null>(null);

  // Unlock Modal state
  let unlockPassphrase = $state('');
  let unlockLoading = $state(false);
  let unlockError = $state<string | null>(null);

  // Incoming shared plan state
  let incomingPlanLoading = $state(false);
  let incomingPlanError = $state<string | null>(null);
  let incomingPlanPayload = $state<{
    id: string;
    title: string;
    author: string;
    updatedAt: string;
    hasPassphrase?: boolean;
    canEdit?: boolean;
    data: any;
  } | null>(null);

  const filteredCloudPlans = $derived(
    cloudPlans.filter((p) => {
      const q = cloudSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    })
  );

  $effect(() => {
    if (mode === 'new') {
      newTitle = 'Untitled Electrical Plan';
      newAuthor = panelStore.projectAuthor || '';
      newTemplateMode = 'blank';
    } else if (mode === 'open') {
      cloudError = null;
      fetchCloudPlans();
    } else if (mode === 'save_as' || mode === 'share') {
      editTitle =
        panelStore.projectTitle || panelStore.activePanel.name || 'Residential Distribution Plan';
      editAuthor = panelStore.projectAuthor || '';
      editPassphrase = '';
      removePassphrase = false;
      shareError = null;
      if (mode === 'share' && !panelStore.cloudPlanId) {
        handleSaveToCloud(false);
      }
    } else if (mode === 'unlock') {
      unlockPassphrase = '';
      unlockError = null;
      unlockLoading = false;
    } else if (mode === 'incoming_shared' && incomingPlanId) {
      fetchIncomingPlan(incomingPlanId);
    }
  });

  function getShareUrl(planId: string): string {
    if (typeof window === 'undefined') return `/plan/${planId}`;
    return `${window.location.origin}/plan/${planId}`;
  }

  async function copyShareLink(planId: string) {
    const url = getShareUrl(planId);
    try {
      await navigator.clipboard.writeText(url);
      copiedId = planId;
      onNotify?.('Share link copied to clipboard!');
      setTimeout(() => {
        if (copiedId === planId) copiedId = null;
      }, 2500);
    } catch {
      // Fallback
    }
  }

  async function fetchCloudPlans() {
    isLoadingCloudList = true;
    cloudError = null;
    try {
      const res = await fetch('/api/plans');
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || `Could not load cloud plans (${res.status})`);
      }
      const data = (await res.json()) as { plans?: CloudPlanSummary[] };
      cloudPlans = Array.isArray(data.plans) ? data.plans : [];
    } catch (e: any) {
      cloudError = e?.message || 'Failed to load plans from Cloudflare R2.';
    } finally {
      isLoadingCloudList = false;
    }
  }

  async function handleOpenCloudPlan(id: string) {
    const cleanId = id
      .trim()
      .replace(/^.*\/plan\//, '')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanId) return;

    isLoadingCloudList = true;
    cloudError = null;
    try {
      const token = panelStore.getStoredEditToken(cleanId);
      const res = await fetch(`/api/plans/${encodeURIComponent(cleanId)}`, {
        headers: token ? { 'X-Edit-Token': token } : {}
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || `Plan "${cleanId}" not found.`);
      }
      const result = (await res.json()) as {
        id: string;
        title: string;
        author: string;
        updatedAt: string;
        hasPassphrase?: boolean;
        canEdit?: boolean;
        data: any;
      };
      panelStore.loadFromCloudData(
        result.data,
        result.id,
        result.title,
        result.author,
        result.updatedAt,
        { hasPassphrase: result.hasPassphrase, canEdit: result.canEdit }
      );
      onNotify?.(`Opened cloud plan "${result.title}"`);
      onClose();
    } catch (e: any) {
      cloudError = e?.message || 'Failed to open cloud plan.';
    } finally {
      isLoadingCloudList = false;
    }
  }

  async function handleDeleteCloudPlan(id: string, title: string) {
    if (!confirm(`Delete cloud plan "${title}" (/plan/${id}) from R2 storage?`)) return;
    try {
      const token = panelStore.getStoredEditToken(id);
      const res = await fetch(`/api/plans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { 'X-Edit-Token': token } : {}
      });
      if (res.ok) {
        cloudPlans = cloudPlans.filter((p) => p.id !== id);
        panelStore.removeStoredEditToken(id);
        if (panelStore.cloudPlanId === id) {
          panelStore.cloudPlanId = null;
          panelStore.saveToLocalStorage(false);
        }
        onNotify?.(`Deleted cloud plan "${title}"`);
      } else {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        alert(err.message || 'Cannot delete this plan.');
      }
    } catch (e) {
      console.error('Failed to delete cloud plan:', e);
    }
  }

  async function handleSaveToCloud(asNewCopy: boolean) {
    shareError = null;
    panelStore.projectTitle = editTitle.trim() || 'Residential Distribution Plan';
    panelStore.projectAuthor = editAuthor.trim();
    panelStore.saveToLocalStorage(false);

    try {
      const result = await panelStore.saveToCloud(asNewCopy, editPassphrase, removePassphrase);
      onNotify?.(
        asNewCopy
          ? `Saved as new cloud plan (/plan/${result.id})`
          : `Saved to cloud (/plan/${result.id})`
      );
      if (mode === 'save_as') {
        onClose();
      }
    } catch (e: any) {
      shareError = e?.message || 'Could not save plan to Cloudflare R2.';
    }
  }

  async function handleUnlock() {
    unlockLoading = true;
    unlockError = null;
    try {
      await panelStore.unlockWithPassphrase(unlockPassphrase);
      onNotify?.('Plan unlocked! You now have direct author/editor permissions.');
      unlockPassphrase = '';
      onClose();
    } catch (e: any) {
      unlockError = e?.message || 'Incorrect passphrase.';
    } finally {
      unlockLoading = false;
    }
  }

  function handleDownloadLocalJSON() {
    if (editTitle.trim()) {
      panelStore.projectTitle = editTitle.trim();
      panelStore.projectAuthor = editAuthor.trim();
      panelStore.saveToLocalStorage(false);
    }
    const jsonStr = panelStore.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (panelStore.projectTitle || panelStore.activePanel.name || 'circuit_plan')
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '_');
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(`Downloaded ${safeName}.json`);
    if (mode === 'save_as') {
      onClose();
    }
  }

  function handleLocalFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = panelStore.importJSON(content);
        if (success) {
          onNotify?.(`Opened local file "${file.name}"`);
          onClose();
        } else {
          cloudError = 'Failed to parse JSON project file.';
        }
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function handleCreateNewProject() {
    panelStore.newProject(newTemplateMode, newTitle, newAuthor);
    onNotify?.(
      newTemplateMode === 'template'
        ? `Created "${panelStore.projectTitle}" from Residential Template`
        : `Created blank project "${panelStore.projectTitle}"`
    );
    onClose();
  }

  async function fetchIncomingPlan(id: string) {
    incomingPlanLoading = true;
    incomingPlanError = null;
    incomingPlanPayload = null;
    try {
      const token = panelStore.getStoredEditToken(id);
      const res = await fetch(`/api/plans/${encodeURIComponent(id)}`, {
        headers: token ? { 'X-Edit-Token': token } : {}
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || `Shared plan "/plan/${id}" was not found.`);
      }
      incomingPlanPayload = await res.json();
    } catch (e: any) {
      incomingPlanError = e?.message || 'Failed to load shared plan.';
    } finally {
      incomingPlanLoading = false;
    }
  }

  function confirmLoadIncomingPlan() {
    if (!incomingPlanPayload) return;
    panelStore.loadFromCloudData(
      incomingPlanPayload.data,
      incomingPlanPayload.id,
      incomingPlanPayload.title,
      incomingPlanPayload.author,
      incomingPlanPayload.updatedAt,
      {
        hasPassphrase: incomingPlanPayload.hasPassphrase,
        canEdit: incomingPlanPayload.canEdit
      }
    );
    onNotify?.(`Loaded shared plan "${incomingPlanPayload.title}"`);
    onClose();
  }
</script>

{#if mode}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    onclick={onClose}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal Dialog Window -->
    <div
      class="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-scale-in"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- 1. NEW PROJECT MODAL -->
      {#if mode === 'new'}
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-950/60 border border-blue-700/60 rounded-xl text-blue-400">
              <FilePlus class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100">Create New Project</h2>
              <p class="text-xs text-slate-400">Start a new distribution panel or load standard engineering template.</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition" onclick={onClose}>
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs">
          <div class="space-y-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Project Title</label>
              <input
                type="text"
                bind:value={newTitle}
                placeholder="e.g. 2-Storey Residential Distribution"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Electrical Engineer / Author</label>
              <input
                type="text"
                bind:value={newAuthor}
                placeholder="e.g. Engr. Juan Dela Cruz, PEE"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-2">Starting Workspace</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                class="p-4 rounded-xl border text-left transition flex flex-col gap-2 {newTemplateMode === 'blank'
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}"
                onclick={() => (newTemplateMode = 'blank')}
              >
                <div class="flex items-center justify-between">
                  <LayoutGrid class="w-5 h-5 text-blue-400" />
                  {#if newTemplateMode === 'blank'}
                    <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                  {/if}
                </div>
                <div>
                  <div class="font-bold text-slate-100 text-sm">Blank 2-Row Panel</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">Empty 24-module DIN panel with ground & neutral busbars.</div>
                </div>
              </button>

              <button
                type="button"
                class="p-4 rounded-xl border text-left transition flex flex-col gap-2 {newTemplateMode === 'template'
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}"
                onclick={() => (newTemplateMode = 'template')}
              >
                <div class="flex items-center justify-between">
                  <Sparkles class="w-5 h-5 text-amber-400" />
                  {#if newTemplateMode === 'template'}
                    <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                  {/if}
                </div>
                <div>
                  <div class="font-bold text-slate-100 text-sm">Residential + Solar Template</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">Pre-wired Main Incomer, Surge Protection, RCD, and Circuits.</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            onclick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20"
            onclick={handleCreateNewProject}
          >
            Create Project
          </button>
        </div>

      <!-- 2. OPEN PROJECT MODAL -->
      {:else if mode === 'open'}
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-400">
              <FolderOpen class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100">Open Electrical Plan</h2>
              <p class="text-xs text-slate-400">Load a shared plan from Cloudflare R2 or open a local .json file.</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition" onclick={onClose}>
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="px-6 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition {openTab === 'cloud'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
              onclick={() => (openTab = 'cloud')}
            >
              <Cloud class="w-3.5 h-3.5" />
              <span>Cloud Plans ({cloudPlans.length})</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition {openTab === 'local'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
              onclick={() => (openTab = 'local')}
            >
              <HardDrive class="w-3.5 h-3.5" />
              <span>Local File (.json)</span>
            </button>
          </div>

          {#if openTab === 'cloud'}
            <button
              type="button"
              class="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition"
              onclick={fetchCloudPlans}
              title="Refresh Cloud Plans"
            >
              <RefreshCw class="w-3.5 h-3.5 {isLoadingCloudList ? 'animate-spin text-blue-400' : ''}" />
              <span>Refresh</span>
            </button>
          {/if}
        </div>

        <div class="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {#if cloudError}
            <div class="bg-red-950/40 border border-red-700/60 text-red-200 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle class="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{cloudError}</span>
            </div>
          {/if}

          {#if openTab === 'cloud'}
            <!-- Quick Open by Plan ID or URL -->
            <div class="flex items-center gap-2">
              <input
                type="text"
                bind:value={directPlanInput}
                placeholder="Paste Share URL (/plan/abc12345) or Plan ID..."
                class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-blue-500 font-mono text-xs"
                onkeydown={(e) => {
                  if (e.key === 'Enter' && directPlanInput.trim()) {
                    handleOpenCloudPlan(directPlanInput);
                  }
                }}
              />
              <button
                type="button"
                disabled={!directPlanInput.trim() || isLoadingCloudList}
                class="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold transition"
                onclick={() => handleOpenCloudPlan(directPlanInput)}
              >
                Open ID
              </button>
            </div>

            <!-- Filter saved cloud plans -->
            {#if cloudPlans.length > 0}
              <input
                type="text"
                bind:value={cloudSearch}
                placeholder="Search saved cloud plans by title, engineer, or ID..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-slate-700"
              />
            {/if}

            {#if isLoadingCloudList}
              <div class="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw class="w-5 h-5 animate-spin text-blue-400" />
                <span>Loading saved plans from Cloudflare R2...</span>
              </div>
            {:else if filteredCloudPlans.length === 0}
              <div class="py-10 text-center text-slate-500 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                No cloud plans found in R2 yet. Click <strong>Save</strong> or <strong>Share</strong> to publish your first plan!
              </div>
            {:else}
              <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                {#each filteredCloudPlans as plan (plan.id)}
                  {@const isOwner = panelStore.hasStoredEditToken(plan.id)}
                  <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-slate-100 text-sm truncate">{plan.title}</span>
                        <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                          /plan/{plan.id}
                        </span>
                        {#if isOwner}
                          <span class="inline-flex items-center gap-0.5 font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                            <ShieldCheck class="w-2.5 h-2.5" /> Author
                          </span>
                        {/if}
                        {#if plan.hasPassphrase}
                          <span class="inline-flex items-center gap-0.5 font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-700/50">
                            <KeyRound class="w-2.5 h-2.5" /> Passphrase
                          </span>
                        {/if}
                      </div>
                      <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        {#if plan.author}
                          <span class="flex items-center gap-1 text-slate-300">
                            <User class="w-3 h-3 text-slate-500" />
                            {plan.author}
                          </span>
                        {/if}
                        <span>{plan.panelCount} Panel{plan.panelCount > 1 ? 's' : ''}</span>
                        <span>{plan.deviceCount} Breakers</span>
                        <span>{plan.wireCount} Wires</span>
                        <span class="text-slate-500">
                          {new Date(plan.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        onclick={() => copyShareLink(plan.id)}
                        title="Copy Share Link (/plan/{plan.id})"
                      >
                        {#if copiedId === plan.id}
                          <Check class="w-3.5 h-3.5 text-emerald-400" />
                        {:else}
                          <Copy class="w-3.5 h-3.5" />
                        {/if}
                      </button>

                      {#if isOwner}
                        <button
                          type="button"
                          class="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                          onclick={() => handleDeleteCloudPlan(plan.id, plan.title)}
                          title="Delete from Cloud (Author Only)"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      {:else}
                        <span class="p-2 text-slate-600" title="Protected: Only the author can delete this plan">
                          <Lock class="w-3.5 h-3.5" />
                        </span>
                      {/if}

                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                        onclick={() => handleOpenCloudPlan(plan.id)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            <!-- Local .JSON upload -->
            <div class="p-8 border-2 border-dashed border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-3">
              <Upload class="w-8 h-8 text-blue-400" />
              <div>
                <div class="font-bold text-slate-100 text-sm">Upload Project File</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Select a .json file previously exported from Circuit Breaker Planner</div>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                bind:this={localFileInput}
                onchange={handleLocalFileUpload}
                class="hidden"
              />
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition mt-2"
                onclick={() => localFileInput?.click()}
              >
                Browse .JSON File...
              </button>
            </div>
          {/if}
        </div>

      <!-- 3. SAVE / SAVE AS MODAL -->
      {:else if mode === 'save_as'}
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-950/60 border border-blue-700/60 rounded-xl text-blue-400">
              <Save class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100">Save Electrical Project</h2>
              <p class="text-xs text-slate-400">Save to Cloudflare R2 object storage or download a local .json file.</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition" onclick={onClose}>
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs">
          {#if shareError}
            <div class="bg-red-950/40 border border-red-700/60 text-red-200 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle class="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{shareError}</span>
            </div>
          {/if}

          <!-- Notice if user is viewing someone else's shared plan in Read-Only mode -->
          {#if panelStore.cloudPlanId && !panelStore.canEditCurrentPlan}
            <div class="bg-amber-950/50 border border-amber-600/60 p-3 rounded-xl space-y-2">
              <div class="flex items-center gap-2 text-amber-300 font-bold">
                <Lock class="w-4 h-4" />
                <span>You are viewing a shared plan (Read-Only)</span>
              </div>
              <p class="text-[11px] text-amber-200/90 leading-relaxed">
                You cannot overwrite the author's original plan without their passphrase.
                You can save a new copy as your own project below, or unlock direct editing if you know the author's passphrase.
              </p>
              {#if panelStore.currentPlanHasPassphrase}
                <button
                  type="button"
                  class="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition flex items-center gap-1.5"
                  onclick={() => {
                    mode = 'unlock';
                  }}
                >
                  <KeyRound class="w-3.5 h-3.5" />
                  <span>Enter Passphrase to Overwrite Original</span>
                </button>
              {/if}
            </div>
          {/if}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Project Title</label>
              <input
                type="text"
                bind:value={editTitle}
                placeholder="e.g. Main Distribution & Solar Hybrid Plan"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Electrical Engineer / Author</label>
              <input
                type="text"
                bind:value={editAuthor}
                placeholder="e.g. Engr. Juan Dela Cruz"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Passphrase Protection Option -->
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                <KeyRound class="w-3.5 h-3.5 text-amber-400" />
                <span>Collaborator Edit Passphrase (Optional)</span>
              </label>
              {#if panelStore.currentPlanHasPassphrase}
                <span class="text-[10px] text-emerald-400 font-mono">Passphrase Active</span>
              {/if}
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              As the author, you can always edit directly from this browser without entering a passphrase.
              Set a passphrase if you want other engineers with the link to be able to edit directly.
            </p>
            <input
              type="password"
              bind:value={editPassphrase}
              placeholder={panelStore.currentPlanHasPassphrase ? 'Enter new passphrase (or leave blank to keep current)...' : 'Set optional collaborator edit passphrase...'}
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-amber-500 font-mono text-xs"
            />
          </div>

          <div class="space-y-2.5 pt-2">
            {#if panelStore.cloudPlanId && panelStore.canEditCurrentPlan}
              <button
                type="button"
                disabled={panelStore.isSavingCloud}
                class="w-full p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-between transition shadow-lg shadow-blue-600/20"
                onclick={() => handleSaveToCloud(false)}
              >
                <div class="flex items-center gap-3 text-left">
                  <Cloud class="w-5 h-5" />
                  <div>
                    <div class="font-bold text-sm">Overwrite Current Cloud Plan (/plan/{panelStore.cloudPlanId})</div>
                    <div class="text-[11px] text-blue-100">Updates the existing shared link in Cloudflare R2</div>
                  </div>
                </div>
                <span class="font-mono text-xs bg-blue-700/80 px-2.5 py-1 rounded">Save</span>
              </button>
            {/if}

            <button
              type="button"
              disabled={panelStore.isSavingCloud}
              class="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center justify-between transition shadow-lg shadow-emerald-600/20"
              onclick={() => handleSaveToCloud(true)}
            >
              <div class="flex items-center gap-3 text-left">
                <Share2 class="w-5 h-5" />
                <div>
                  <div class="font-bold text-sm">
                    {panelStore.cloudPlanId ? 'Save As New Cloud Plan Copy (Fork)' : 'Save to Cloud Storage (R2)'}
                  </div>
                  <div class="text-[11px] text-emerald-100">
                    Generates a new shareable link (/plan/&lt;new-id&gt;) where you are the author
                  </div>
                </div>
              </div>
              <span class="font-mono text-xs bg-emerald-700/80 px-2.5 py-1 rounded">New Copy</span>
            </button>

            <button
              type="button"
              class="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-between transition"
              onclick={handleDownloadLocalJSON}
            >
              <div class="flex items-center gap-3 text-left">
                <Download class="w-5 h-5 text-blue-400" />
                <div>
                  <div class="font-bold text-sm">Download Local File (.json)</div>
                  <div class="text-[11px] text-slate-400">Save a backup file directly to your computer</div>
                </div>
              </div>
              <span class="font-mono text-xs bg-slate-900 px-2.5 py-1 rounded text-slate-300">.JSON</span>
            </button>
          </div>
        </div>

      <!-- 4. SHARE PLAN MODAL -->
      {:else if mode === 'share'}
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-950/60 border border-blue-700/60 rounded-xl text-blue-400">
              <Share2 class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100">Share Plan with Electrical Engineers</h2>
              <p class="text-xs text-slate-400">Synced with Cloudflare R2 Object Storage via clean /plan/&lt;id&gt; links.</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition" onclick={onClose}>
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs">
          {#if shareError}
            <div class="bg-red-950/40 border border-red-700/60 text-red-200 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle class="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{shareError}</span>
            </div>
          {/if}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Project Title</label>
              <input
                type="text"
                bind:value={editTitle}
                placeholder="e.g. Main Distribution Panel"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Prepared By (Engineer / Author)</label>
              <input
                type="text"
                bind:value={editAuthor}
                placeholder="e.g. Engr. Juan Dela Cruz"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {#if panelStore.isSavingCloud}
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-slate-300">
              <RefreshCw class="w-4 h-4 animate-spin text-blue-400" />
              <span>Syncing electrical plan to Cloudflare R2...</span>
            </div>
          {:else if panelStore.cloudPlanId}
            <div class="p-4 rounded-xl bg-slate-950 border border-emerald-700/50 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                  Shareable Plan Link
                </span>
                {#if panelStore.lastSavedAt}
                  <span class="text-[10px] text-slate-400 font-mono">
                    Synced: {new Date(panelStore.lastSavedAt).toLocaleTimeString()}
                  </span>
                {/if}
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="text"
                  readonly
                  value={getShareUrl(panelStore.cloudPlanId)}
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-blue-300 font-mono text-xs outline-none"
                />
                <button
                  type="button"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
                  onclick={() => copyShareLink(panelStore.cloudPlanId!)}
                >
                  {#if copiedId === panelStore.cloudPlanId}
                    <Check class="w-4 h-4" />
                    <span>Copied!</span>
                  {:else}
                    <Copy class="w-4 h-4" />
                    <span>Copy Link</span>
                  {/if}
                </button>
              </div>

              <div class="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  Protected: Other engineers viewing this link cannot overwrite your plan. They can view, inspect, calculate BOM, and save their own copy.
                </span>
              </div>
            </div>
          {/if}

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={panelStore.isSavingCloud}
              class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
              onclick={() => handleSaveToCloud(true)}
            >
              <FilePlus class="w-3.5 h-3.5 text-emerald-400" />
              <span>Save as New Link Copy</span>
            </button>

            {#if panelStore.canEditCurrentPlan}
              <button
                type="button"
                disabled={panelStore.isSavingCloud}
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20"
                onclick={() => handleSaveToCloud(false)}
              >
                <Cloud class="w-4 h-4" />
                <span>Update Cloud Plan</span>
              </button>
            {/if}
          </div>
        </div>

      <!-- 5. UNLOCK PLAN MODAL -->
      {:else if mode === 'unlock'}
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-400">
              <KeyRound class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100">Unlock Direct Editing</h2>
              <p class="text-xs text-slate-400">Enter the author's passphrase to gain direct edit rights for /plan/{panelStore.cloudPlanId}.</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition" onclick={onClose}>
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs">
          {#if unlockError}
            <div class="bg-red-950/40 border border-red-700/60 text-red-200 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle class="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{unlockError}</span>
            </div>
          {/if}

          <p class="text-slate-300 leading-relaxed">
            The author has protected this plan with a passphrase. If the author shared the passphrase with you, enter it below to unlock direct overwriting rights from this browser.
          </p>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Author's Passphrase</label>
            <input
              type="password"
              bind:value={unlockPassphrase}
              placeholder="Enter passphrase..."
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none focus:border-amber-500 font-mono text-sm"
              onkeydown={(e) => {
                if (e.key === 'Enter' && unlockPassphrase.trim()) {
                  handleUnlock();
                }
              }}
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            onclick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!unlockPassphrase.trim() || unlockLoading}
            class="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
            onclick={handleUnlock}
          >
            {#if unlockLoading}
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              <span>Verifying...</span>
            {:else}
              <Unlock class="w-3.5 h-3.5" />
              <span>Unlock Plan</span>
            {/if}
          </button>
        </div>

      <!-- 6. INCOMING SHARED LINK PROMPT (/plan/<id>) -->
      {:else if mode === 'incoming_shared'}
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-950/60 border border-blue-700/60 rounded-xl text-blue-400">
              <FileText class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100">Shared Electrical Plan</h2>
              <p class="text-xs text-slate-400">
                Link: <span class="font-mono text-blue-400">/plan/{incomingPlanId}</span>
              </p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition" onclick={onClose}>
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs">
          {#if incomingPlanLoading}
            <div class="py-10 text-center text-slate-300 flex flex-col items-center gap-2">
              <RefreshCw class="w-6 h-6 animate-spin text-blue-400" />
              <span>Fetching shared plan from Cloudflare R2...</span>
            </div>
          {:else if incomingPlanError}
            <div class="bg-red-950/40 border border-red-700/60 text-red-200 p-4 rounded-xl flex items-center gap-2.5">
              <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <div class="font-bold text-sm">Could Not Load Shared Plan</div>
                <div class="text-xs text-red-300 mt-0.5">{incomingPlanError}</div>
              </div>
            </div>
          {:else if incomingPlanPayload}
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div class="text-sm font-bold text-white flex items-center gap-2">
                <span>{incomingPlanPayload.title}</span>
                {#if incomingPlanPayload.canEdit}
                  <span class="inline-flex items-center gap-0.5 font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                    <ShieldCheck class="w-2.5 h-2.5" /> Author
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-0.5 font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-700/50">
                    <Lock class="w-2.5 h-2.5" /> Read-Only
                  </span>
                {/if}
              </div>
              <div class="flex flex-wrap gap-3 text-slate-400 text-[11px]">
                {#if incomingPlanPayload.author}
                  <span>Prepared by: <strong class="text-slate-200">{incomingPlanPayload.author}</strong></span>
                {/if}
                <span>Panels: <strong class="text-slate-200">{incomingPlanPayload.data?.panels?.length || 1}</strong></span>
                <span>Breakers: <strong class="text-slate-200">{incomingPlanPayload.data?.devices?.length || 0}</strong></span>
                <span>Wires: <strong class="text-slate-200">{incomingPlanPayload.data?.wires?.length || 0}</strong></span>
                <span>Updated: <strong class="text-slate-200">{new Date(incomingPlanPayload.updatedAt).toLocaleString()}</strong></span>
              </div>
            </div>

            <p class="text-slate-400 leading-relaxed">
              Loading this shared plan will replace the current workspace on your screen. You can download a backup of your current local work first if needed.
            </p>
          {/if}
        </div>

        <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            onclick={handleDownloadLocalJSON}
          >
            <Download class="w-3.5 h-3.5" />
            <span>Backup Current Workspace (.json)</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              onclick={onClose}
            >
              Keep Current Work
            </button>
            {#if incomingPlanPayload}
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20"
                onclick={confirmLoadIncomingPlan}
              >
                Load Shared Plan
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
