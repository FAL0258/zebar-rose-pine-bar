import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { GroupItem } from "@components/group.component";

export function StopWatchWidget() {
  const [elapsedSeconds, setElapsedSeconds] = createSignal(0);
  const [isRunning, setIsRunning] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);

  let timerInterval: number | undefined;
  let syncChannel: BroadcastChannel;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const tick = () => {
    setElapsedSeconds((prev) => prev + 1);
  };

  // 1. Initialize the BroadcastChannel when the component mounts
  onMount(() => {
    syncChannel = new BroadcastChannel("stopwatch_sync");

    // 2. Listen for actions triggered on other monitors
    syncChannel.onmessage = (event) => {
      const data = event.data;
      
      setElapsedSeconds(data.time);

      if (data.action === "start") {
        setIsRunning(true);
        clearInterval(timerInterval);
        timerInterval = window.setInterval(tick, 1000);
      } else if (data.action === "pause") {
        setIsRunning(false);
        clearInterval(timerInterval);
      } else if (data.action === "reset") {
        setIsRunning(false);
        clearInterval(timerInterval);
        setElapsedSeconds(0);
      }
    };
  });

  // Clean up the interval and channel if the widget unmounts
  onCleanup(() => {
    clearInterval(timerInterval);
    if (syncChannel) syncChannel.close();
  });

  const toggleTimer = (e?: Event) => {
    if (e) e.stopPropagation(); 
    
    if (isRunning()) {
      setIsRunning(false);
      clearInterval(timerInterval);
      // 3. Broadcast the pause action
      syncChannel?.postMessage({ action: "pause", time: elapsedSeconds() });
    } else {
      setIsRunning(true);
      clearInterval(timerInterval);
      timerInterval = window.setInterval(tick, 1000);
      // 4. Broadcast the start action
      syncChannel?.postMessage({ action: "start", time: elapsedSeconds() });
    }
  };

  const resetTimer = (e: Event) => {
    e.stopPropagation();
    setIsRunning(false);
    clearInterval(timerInterval);
    setElapsedSeconds(0);
    // 5. Broadcast the reset action
    syncChannel?.postMessage({ action: "reset", time: 0 });
  };

  const iconColor = () => {
    if (isRunning()) return "var(--color-rose-pine-foam)";
    if (elapsedSeconds() > 0 && !isRunning()) return "var(--color-rose-pine-gold)";
    return "var(--color-rose-pine-text)";
  };

  return (
    <GroupItem>
      <div 
        class="flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          class="flex items-center cursor-pointer select-none" 
          onClick={toggleTimer}
        >
          <span style={{ color: iconColor(), transition: "color var(--duration-250) var(--ease-ios)" }}>
            ⏱
          </span>
          <span class="w-[48px] text-right" style={{ color: "var(--color-rose-pine-text)" }}>
            {formatTime(elapsedSeconds())}
          </span>
        </div>

        <Show when={isHovered()}>
          <div 
            class="flex items-center gap-1 pl-2 ml-2 transition-opacity" 
            style={{ "border-left": "1px solid var(--color-rose-pine-highlight-med)" }}
          >
            <button 
              onClick={toggleTimer} 
              class="px-1 rounded transition-colors hover:bg-[var(--color-rose-pine-overlay)]" 
              title="Start/Pause"
            >
              {isRunning() ? "⏸" : "▶"}
            </button>
            <button 
              onClick={resetTimer} 
              class="px-1 rounded transition-colors hover:bg-[var(--color-rose-pine-overlay)] hover:text-[var(--color-rose-pine-love)]" 
              title="Reset"
            >
              ⏹
            </button>
          </div>
        </Show>
      </div>
    </GroupItem>
  );
}