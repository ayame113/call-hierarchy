import { CompositeDisposable } from "atom";
import { ProviderRegistry } from "atom-ide-base/commons-atom/ProviderRegistry";

import { CallHierarchyView } from "./call-hierarchy-view";
import type { CallHierarchyProvider } from "./call-hierarchy";

// TODO: remove any
const callHierarchyProviderRegistry = new ProviderRegistry<any>();
const subscriptions = new CompositeDisposable();
let item: CallHierarchyView;

export function activate() {
  subscriptions.add(
    item = new CallHierarchyView({
      providerRegistry: callHierarchyProviderRegistry,
    }),
    atom.commands.add(
      "atom-workspace",
      "call-hierarchy:toggle",
      toggleCallHierarchy,
    ),
  );
  if (atom.config.get("atom-ide-call-hierarchy.initialDisplay")) {
    toggleCallHierarchy();
  }
}

export function deactivate() {
  subscriptions.dispose();
  atom.workspace.paneForItem(item)?.destroyItem(item);
}

export function consumeCallHierarchyProvider(provider: CallHierarchyProvider) {
  const providerDisposer = callHierarchyProviderRegistry.addProvider(provider);
  subscriptions.add(providerDisposer);
  return providerDisposer;
}

export function toggleCallHierarchy() {
  const rightDock = atom.workspace.getRightDock();
  let pane = atom.workspace.paneForItem(item);
  if (
    pane && pane.getActiveItem() === item &&
    // @ts-ignore (getVisiblePanes is not includes typedef)
    atom.workspace.getVisiblePanes().includes(pane)
  ) {
    pane.destroyItem(item);
    return;
  }
  if (!pane) {
    pane = rightDock.getActivePane();
    pane.addItem(item);
  }
  item.activate();
  pane.activateItem(item);
  rightDock.show();
}

export const config = {
  initialDisplay: {
    title: "Initial Call Hierarchy Display",
    description: "Show call hierarchy initially aftern atom loads",
    type: "boolean",
    default: true,
  },
};
