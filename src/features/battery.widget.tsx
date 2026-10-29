import { useProviders } from "@providers/index";
import { GroupItem } from "@components/group.component";
import { createSignal, createEffect, onCleanup, untrack } from "solid-js";
import { RiDeviceBatteryLine } from "solid-icons/ri";

export function BatteryWidget() {
  const providers = useProviders();
  
  // Initialize with fallback or current charge
  const [batteryPercent, setBatteryPercent] = createSignal(
    Math.round(untrack(() => providers.battery?.chargePercent) ?? 100)
  );

  // Poll only once every 60 seconds without attaching reactive tracking
  createEffect(() => {
    const updateBattery = () => {
      const charge = untrack(() => providers.battery?.chargePercent);
      if (charge !== undefined && charge !== null) {
        setBatteryPercent(Math.round(charge));
      }
    };

    // Run once immediately on mount
    updateBattery();

    const interval = setInterval(updateBattery, 60000);
    onCleanup(() => clearInterval(interval));
  });

  // Dynamic Rosé Pine color based on charge thresholds
  const iconColor = () => {
    const pct = batteryPercent();
    if (pct <= 20) return "text-rose-pine-love";
    if (pct <= 40) return "text-rose-pine-gold";
    return "text-rose-pine-foam";
  };

  return (
    <GroupItem>
      <span class="flex items-center justify-center gap-1 select-none">
        <RiDeviceBatteryLine class={`w-4 h-4 transition-colors ${iconColor()}`} />
        <span class="w-[35px] text-right">
          {batteryPercent()}%
        </span>
      </span>
    </GroupItem>
  );
}