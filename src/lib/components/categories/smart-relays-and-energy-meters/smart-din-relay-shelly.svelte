<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";
  import StandardBreakerFaceplate from "../shared/StandardBreakerFaceplate.svelte";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let props: Props = $props();
</script>

<StandardBreakerFaceplate {...props} />

