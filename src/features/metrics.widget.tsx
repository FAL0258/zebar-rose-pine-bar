import { useProviders } from "@providers/index";
import { GroupItem } from "@components/group.component";
import {
  animate,
  AnimationPlaybackControlsWithThen,
  MotionValue,
} from "motion";
import {
  Accessor,
  createEffect,
  createSignal,
  onCleanup,
  untrack,
  EffectFunction,
  ParentProps,
} from "solid-js";
import { useMotionValue } from "@/motion/hooks";
import { FaSolidMemory, FaSolidArrowDown, FaSolidArrowUp } from "solid-icons/fa";
import { RiDeviceCpuLine } from "solid-icons/ri";

function Metric(props: ParentProps) {
  return (
    <span class="flex items-center justify-center gap-1">{props.children}</span>
  );
}

function metricsAnimation(
  rawMotionValue: MotionValue<number>,
  metric: Accessor<number | undefined>,
): EffectFunction<
  AnimationPlaybackControlsWithThen | undefined,
  AnimationPlaybackControlsWithThen
> {
  return (prev) => {
    const control = animate(rawMotionValue, metric() || 0, {
      duration: 1,
      ease: "circOut",
      autoplay: Boolean(!prev || prev.state === "finished"),
    });

    if (prev && prev.state === "running") {
      prev?.then(() => {
        control.play();
      });
    }

    return control;
  };
}

// Strictly convert bytes to Megabits per second (Mb/s)
function formatMbps(bytes: number) {
  if (!bytes || bytes === 0) return "0.00 Mb/s";
  // Multiply by 8 to get bits, then divide by 1,000,000 for Megabits
  return ((bytes * 8) / 1000000).toFixed(2) + " Mb/s";
}

export function MetricsWidget() {
  const providers = useProviders();
  const cpuUsage = useMotionValue(0);
  const memoryUsage = useMotionValue(0);
  
  const [throttledCpu, setThrottledCpu] = createSignal(0);
  const [throttledMem, setThrottledMem] = createSignal(0);
  const [throttledNetDown, setThrottledNetDown] = createSignal(0);
  const [throttledNetUp, setThrottledNetUp] = createSignal(0);

  // Interval 1: CPU & RAM (Every 5 seconds for resource saving)
  createEffect(() => {
    const hwInterval = setInterval(() => {
      setThrottledCpu(untrack(() => providers.cpu?.usage) || 0);
      setThrottledMem(untrack(() => providers.memory?.usage) || 0);
    }, 5000);
    onCleanup(() => clearInterval(hwInterval));
  });

  // Interval 2: Network Traffic (Every 3 seconds)
  createEffect(() => {
    const netInterval = setInterval(() => {
      setThrottledNetDown(untrack(() => providers.network?.traffic?.received?.bytes) || 0);
      setThrottledNetUp(untrack(() => providers.network?.traffic?.transmitted?.bytes) || 0);
    }, 3000);
    onCleanup(() => clearInterval(netInterval));
  });

  createEffect(metricsAnimation(cpuUsage.raw, throttledCpu));
  createEffect(metricsAnimation(memoryUsage.raw, throttledMem));

  return (
    <GroupItem class="justify-end gap-3">
      {/* Network Down */}
      <Metric>
        <FaSolidArrowDown class="w-3 h-3 text-rose-pine-foam" />
        <span class="w-[80px] text-right">{formatMbps(throttledNetDown())}</span>
      </Metric>
      {/* Network Up */}
      <Metric>
        <FaSolidArrowUp class="w-3 h-3 text-rose-pine-iris" />
        <span class="w-[80px] text-right">{formatMbps(throttledNetUp())}</span>
      </Metric>
      {/* CPU Usage */}
      <Metric>
        <RiDeviceCpuLine class="w-4 h-4 text-rose-pine-rose" />
        <span class="w-[35px] text-right">{Math.round(cpuUsage.get()).toLocaleString(undefined, {})}%</span>
      </Metric>
      {/* RAM Usage */}
      <Metric>
        <FaSolidMemory class="w-4 h-4 text-rose-pine-pine" />
        <span class="w-[35px] text-right">{Math.round(memoryUsage.get()).toLocaleString(undefined, {})}%</span>
      </Metric>
    </GroupItem>
  );
}