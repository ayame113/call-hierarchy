"use babel"

const { TextEditor, Point } = require("atom")
import { CallHierarchyView } from "../lib/call-hierarchy-view"
import { statuses } from "../lib/statuses"
import callHierarchyMock from "./call-hierarchyMock"

describe("CallHierarchy view", () => {
  let view, editor, point
  beforeEach(() => {
    view = new CallHierarchyView({
      providerRegistry: {
        getProviderForEditor: () => ({
          getIncomingCallHierarchy: () => Promise.resolve(callHierarchyMock),
          getOutgoingCallHierarchy: () => Promise.resolve(callHierarchyMock),
        }),
      },
    })
    view.activate()
    editor = new TextEditor()
    point = new Point(0, 0)
  })
  it("renders HTML", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("atom-ide-call-hierarchy-item")
    expect(content.children.length).toEqual(3)
  })
  it("renders title", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("atom-ide-call-hierarchy-item")
    expect(content.children[0].querySelector(":scope>div span:nth-child(2)").innerHTML).toEqual("name1")
    expect(content.children[1].querySelector(":scope>div span:nth-child(2)").innerHTML).toEqual("name2")
    expect(content.children[2].querySelector(":scope>div span:nth-child(2)").innerHTML).toEqual("name3")
  })
  it("renders child", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("atom-ide-call-hierarchy-item")
    for (const child of content.children) {
      expect(child.querySelector(":scope>atom-ide-call-hierarchy-item").children.length).toEqual(3)
    }
  })
  it("renders child content", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("atom-ide-call-hierarchy-item")
    for (const child of content.children) {
      const childContent = child.querySelector(":scope>atom-ide-call-hierarchy-item")
      expect(childContent.children[0].querySelector(":scope>div span:nth-child(2)").innerHTML).toEqual("name1")
      expect(childContent.children[1].querySelector(":scope>div span:nth-child(2)").innerHTML).toEqual("name2")
      expect(childContent.children[2].querySelector(":scope>div span:nth-child(2)").innerHTML).toEqual("name3")
    }
  })
  it("renders child content", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("atom-ide-call-hierarchy-item")
    const childContent = content.children[0].querySelector(":scope>atom-ide-call-hierarchy-item")
    expect(childContent.querySelector("atom-ide-call-hierarchy-item")).toEqual(null)
    childContent.querySelector(":scope>div>div").dispatchEvent(new Event("click"))
    waitsFor(
      "item add",
      function () {
        return childContent.querySelector("atom-ide-call-hierarchy-item")
      },
      100
    )
    runs(() => {
      expect(childContent.querySelector("atom-ide-call-hierarchy-item").children.length).toEqual(3)
    })
  })
  it("noEditor", async () => {
    await view.showCallHierarchy(null, null)
    const content = view.querySelector("h1")
    expect(content.innerText).toEqual(statuses.noEditor.title)
  })
})

describe("CallHierarchy provider returns null", () => {
  let view, editor, point
  beforeEach(() => {
    view = new CallHierarchyView({
      providerRegistry: {
        getProviderForEditor: () => ({
          getIncomingCallHierarchy: () => Promise.resolve(null),
          getOutgoingCallHierarchy: () => Promise.resolve(null),
        }),
      },
    })
    view.activate()
    editor = new TextEditor()
    point = new Point(0, 0)
  })
  it("noResult", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("h1")
    expect(content.innerText).toEqual(statuses.noResult.title)
  })
})

describe("CallHierarchy view without provider", () => {
  let view, editor, point
  beforeEach(() => {
    view = new CallHierarchyView({
      providerRegistry: {
        getProviderForEditor: () => null,
      },
    })
    view.activate()
    editor = new TextEditor()
    point = new Point(0, 0)
  })
  it("noProvider", async () => {
    await view.showCallHierarchy(editor, point)
    const content = view.querySelector("h1")
    expect(content.innerText).toEqual(statuses.noProvider.title)
  })
})
