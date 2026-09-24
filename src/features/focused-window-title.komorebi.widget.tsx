import { createMemo } from "solid-js";
import { GroupItem } from "@components/group.component";
import { useProviders } from "@providers/index";

export function FocusedWindowTitleKomorebiWidget() {
  const providers = useProviders();
  const isCurrentMonitor = createMemo(
    () =>
      providers.komorebi?.focusedMonitor === providers.komorebi?.currentMonitor,
  );

const title = createMemo(() => {
    const workspace = providers.komorebi?.focusedWorkspace;
    if (!workspace) return "-";

    // 1. Expand the type to accept null values from Komorebi
    let activeExe: string | null | undefined;

    if (workspace.maximizedWindow) {
      activeExe = workspace.maximizedWindow.exe;
    } 
    else if (workspace.monocleContainer) {
      // 2. Cast to 'any' to bypass Zebar's missing TS definitions
      const monocle = workspace.monocleContainer as any;
      activeExe = monocle.windows[monocle.focusedWindowIndex ?? 0]?.exe;
    } 
    else {
      const activeContainer = workspace.tilingContainers[workspace.focusedContainerIndex] as any;
      if (activeContainer) {
        activeExe = activeContainer.windows[activeContainer.focusedWindowIndex ?? 0]?.exe;
      }
    }

    return (activeExe ?? "-").replace(".exe", "");
  });

  return (
    <GroupItem class="text-ellipsis whitespace-nowrap max-w-[200px] 2xl:max-w-[350px] lg:max-w-[200px]">
      <span
        title={title()}
        classList={{
          "text-rose-pine-muted hover:text-inherit": !isCurrentMonitor(),
        }}
      >
        {title()}
      </span>
    </GroupItem>
  );
}
