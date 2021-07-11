"use babel"

import path from "path"

import * as OutlinePackage from "../lib/main"
import { TextEditor } from "atom"

describe("Outline", () => {
  let workspaceElement, activeEditor

  beforeEach(async () => {
    const mockFilePath = path.join(__dirname, "mockFile")

    workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    await atom.workspace.open(mockFilePath)

    // Package activation will be deferred to the configured, activation hook, which is then triggered
    // Activate activation hook
    atom.packages.triggerDeferredActivationHooks()
    atom.packages.triggerActivationHook("core:loaded-shell-environment")
    await atom.packages.activatePackage("atom-ide-call-hierarchy")

    expect(atom.packages.isPackageLoaded("atom-ide-call-hierarchy")).toBeTruthy()

    activeEditor = atom.workspace.getActiveTextEditor()

    expect(activeEditor).toBeInstanceOf(TextEditor)
  })

  it("adds toggle command", function () {
    const toggleCommand = atom.commands
      .findCommands({
        target: workspaceElement,
      })
      .some((command) => command.name === "call-hierarchy:toggle")

    expect(toggleCommand).toBe(true)
  })

  it("adds/removes outline view from workspace when toggled", () => {
    expect(workspaceElement.querySelector("atom-ide-call-hierarchy-view")).toBeVisible()

    atom.commands.dispatch(workspaceElement, "call-hierarchy:toggle")

    expect(workspaceElement.querySelector("atom-ide-call-hierarchy-view")).not.toExist()

    atom.commands.dispatch(workspaceElement, "call-hierarchy:toggle")

    expect(workspaceElement.querySelector("atom-ide-call-hierarchy-view")).toBeVisible()
  })
})
