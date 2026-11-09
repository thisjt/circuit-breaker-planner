<script lang="ts">
  import { page } from '$app/state';
  import WorkspacePage from '../../+page.svelte';
</script>

<WorkspacePage initialPlanId={page.params.id} />

