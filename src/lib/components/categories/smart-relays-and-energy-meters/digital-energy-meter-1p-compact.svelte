<script lang="ts">
  import type { DeviceDefinition, PlacedDevice } from "#lib/types";
  import DigitalEnergyMeter2p1m from "./digital-energy-meter-2p-1-module-compact.svelte";

  interface Props {
    device: PlacedDevice;
    def: DeviceDefinition;
    totalWidth: number;
    heightPx: number;
    poles: number;
  }

  let props: Props = $props();
</script>

<DigitalEnergyMeter2p1m {...props} />

