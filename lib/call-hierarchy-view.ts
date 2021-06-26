import {
  CompositeDisposable,
  Disposable,
  Point,
  Range,
  TextEditor,
} from "atom";
import { ProviderRegistry } from "atom-ide-base/commons-atom/ProviderRegistry";
import type { CallHierarchy, CallHierarchyProvider } from "./call-hierarchy";

type CallHierarchyType = "incoming" | "outgoing";

class CallHierarchyViewItem<T extends CallHierarchyType> extends HTMLElement {
  #callHierarchy: CallHierarchy<T> | null | undefined;
  #dblclickWaitTime = 300;
  #isDblclick = false;
  constructor(callHierarchy: CallHierarchy<T> | null | undefined) {
    super();
    this.#callHierarchy = callHierarchy;
  }
  get isEmpty() {
    return !this.#callHierarchy || this.#callHierarchy.data.length == 0;
  }
  connectedCallback() {
    if (this.isEmpty) {
      this.innerHTML = '<div class="call-hierarchy-no-data">No Data.</span>';
      return;
    }
    const result = this.#callHierarchy!.data.map((item, i) => {
      const el = document.createElement("li");
      el.setAttribute("title", item.path);
      const inner = el.appendChild(document.createElement("div"));
      inner.appendChild(getIcon(item.icon ?? undefined, undefined));
      inner.insertAdjacentHTML("beforeend", `<span>${item.name}</span>`);
      inner.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (this.#isDblclick && this.#callHierarchy) {
          this.#showDocument(this.#callHierarchy.data[i]);
          return;
        }
        this.toggleItemAt(i);
        window.setTimeout(
          () => this.#isDblclick = false,
          this.#dblclickWaitTime,
        );
        this.#isDblclick = true;
      }, false);
      inner.classList.add("icon");
      inner.classList.add("icon-chevron-right");
      return el;
    });
    this.appendChild(document.createElement("ul")).append(...result);
  }
  async toggleItemAt(i: number) {
    const el = <HTMLLIElement> this.querySelectorAll(`:scope>ul>li`)[i];
    const iconElement = el.querySelector(":scope>div");
    const childCallHierarchy: CallHierarchyViewItem<T> | null = el
      .querySelector("atom-ide-call-hierarchy-item");
    if (childCallHierarchy) {
      if (childCallHierarchy.style.display === "none") {
        childCallHierarchy.style.display = "";
        iconElement?.classList.replace(
          "icon-chevron-right",
          "icon-chevron-down",
        );
      } else {
        childCallHierarchy.style.display = "none";
        iconElement?.classList.replace(
          "icon-chevron-down",
          "icon-chevron-right",
        );
      }
    } else {
      el.appendChild(
        new CallHierarchyViewItem(await this.#callHierarchy?.itemAt(i)),
      );
      iconElement?.classList.replace("icon-chevron-right", "icon-chevron-down");
    }
  }
  async toggleAllItem() {
    const dataLen = this.#callHierarchy?.data.length ?? 0;
    await Promise.all(
      [...Array(dataLen).keys()].map((i) => this.toggleItemAt(i)),
    );
  }
  #showDocument = async (
    { path, range: { start: { row, column } }, selectionRange }: {
      path: string;
      range: Range;
      selectionRange: Range;
    },
  ) => {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor?.getPath() === path) {
      //const paneContainer = atom.workspace.paneContainerForItem(editor)
      //paneContainer?.activate?.()
      editor.setCursorBufferPosition([row, column]);
      editor.scrollToBufferPosition([row, column], { center: true });
      editor.setSelectedBufferRange(selectionRange);
    } else {
      const editor: any = await atom.workspace.open(path, {
        initialLine: row,
        initialColumn: column,
        searchAllPanes: true,
        activatePane: true,
        activateItem: true,
      });
      editor?.setSelectedBufferRange(selectionRange);
    }
  };
}
customElements.define("atom-ide-call-hierarchy-item", CallHierarchyViewItem);

export class CallHierarchyView extends HTMLElement {
  #subscriptions = new CompositeDisposable();
  #editorSubscriptions: Disposable | undefined;
  // TODO: remove any
  #providerRegistry: ProviderRegistry<any>;
  #outputElement: HTMLDivElement;
  #_currentType!: CallHierarchyType;
  #debounceTimeout: number | undefined;
  #debounceWaitTime = 300;
  constructor(
    { providerRegistry }: { providerRegistry: ProviderRegistry<any> },
  ) {
    super();
    this.#providerRegistry = providerRegistry;
    const selectInOrOut = this.appendChild(document.createElement("div"));
    {
      const inElement = selectInOrOut.appendChild(
        document.createElement("div"),
      );
      inElement.innerText = "Incoming";
      inElement.addEventListener("click", () => {
        this.currentType = "incoming";
        this.#showCallHierarchy();
      });
      inElement.classList.add("icon");
      inElement.classList.add("icon-alignment-align");
    }
    {
      const outElement = selectInOrOut.appendChild(
        document.createElement("div"),
      );
      outElement.innerText = "Outgoing";
      outElement.addEventListener("click", () => {
        this.currentType = "outgoing";
        this.#showCallHierarchy();
      });
      outElement.classList.add("icon");
      outElement.classList.add("icon-alignment-aligned-to");
    }
    this.#outputElement = this.appendChild(document.createElement("div"));
    this.currentType = "incoming";
  }

  activate() {
    this.#subscriptions.add(atom.workspace.observeActiveTextEditor((editor) => {
      this.#editorSubscriptions?.dispose();
      this.#editorSubscriptions = editor?.onDidChangeCursorPosition((event) => {
        window.clearTimeout(this.#debounceTimeout);
        this.#debounceTimeout = window.setTimeout(() => {
          this.#showCallHierarchy(editor, event.newBufferPosition);
        }, this.#debounceWaitTime);
      });
      if (editor) {
        this.#showCallHierarchy(editor);
      }
    }));
  }

  getTitle() {
    return "Call Hierarchy";
  }

  getIconName() {
    return "link";
  }

  set currentType(v: CallHierarchyType) {
    this.#_currentType = v;
    this.setAttribute("current-type", v);
  }

  get currentType() {
    return this.#_currentType;
  }

  #showCallHierarchy = async (editor?: TextEditor, point?: Point) => {
    const _editor = editor || atom.workspace.getActiveTextEditor();
    if (!_editor) {
      return;
    }
    const _point = point || _editor.getCursorBufferPosition();
    // TODO: remove type annotation
    const provider: CallHierarchyProvider | null = this.#providerRegistry
      .getProviderForEditor(_editor);
    const newData = await (
      this.currentType === "incoming"
        ? provider?.getIncomingCallHierarchy(_editor, _point)
        : provider?.getOutgoingCallHierarchy(_editor, _point)
    );
    if ((!newData || newData.data.length == 0)) {
      const prevElement: CallHierarchyViewItem<this["currentType"]> | null =
        this.querySelector("atom-ide-call-hierarchy-item");
      if (prevElement && prevElement.isEmpty) return;
    }
    this.#outputElement.innerHTML = "";
    const item = new CallHierarchyViewItem(newData);
    this.#outputElement.appendChild(item);
    item.toggleAllItem();
  };

  destroy() {
    this.#editorSubscriptions?.dispose();
    this.#subscriptions.dispose();
  }

  dispose() {
    this.innerHTML = "";
  }
}
customElements.define("atom-ide-call-hierarchy-view", CallHierarchyView);

// copy from https://github.com/atom-community/atom-ide-outline/blob/642c9ebbc5de7ca8124f388fe12198b84476d91c/src/outlineView.ts#L470

function getIcon(iconType: string | undefined, kindType: string | undefined) {
  // LSP specification: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_documentSymbol
  // atom-languageclient mapping: https://github.com/atom/atom-languageclient/blob/485bb9d706b422456640c9070eee456ef2cf09c0/lib/adapters/outline-view-adapter.ts#L270

  const iconElement = document.createElement("span");
  iconElement.classList.add("call-hierarchy-icon"); // change from 'outline' to 'call-hierarchy'

  // if iconType given instead
  if (kindType === undefined && iconType !== undefined) {
    kindType = iconType;
  }

  let type: string = "🞇";
  if (typeof kindType === "string" && kindType.length > 0) {
    let kindClass: string;
    // hasKind
    if (kindType.indexOf("type-") === 0) {
      // supplied with type-...
      kindClass = `${kindType}`;
      type = kindType.replace("type-", "");
    } else {
      // supplied without type-
      kindClass = `type-${kindType}`;
      type = kindType;
    }
    iconElement.classList.add(kindClass);
  }

  iconElement.innerHTML = `<span>${type.substring(0, 3)}</span>`;

  return iconElement;
}
