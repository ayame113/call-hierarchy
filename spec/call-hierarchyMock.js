"use babel"
export default {
  type: "incoming",
  itemAt() {
    return this
  },
  data: [
    {
      path: "C:\\Users\\azusa\\tmp\\deno_project\\mod.ts",
      name: "name1",
      icon: "type-function",
      tags: [],
      detail: "",
      range: {
        start: { row: 1, column: 0 },
        end: { row: 5, column: 1 },
      },
      selectionRange: {
        start: { row: 1, column: 9 },
        end: { row: 1, column: 14 },
      },
    },
    {
      path: "C:\\Users\\azusa\\tmp\\deno_project\\mod.ts",
      name: "name2",
      icon: "type-function",
      tags: [],
      detail: "",
      range: {
        start: { row: 6, column: 0 },
        end: { row: 11, column: 1 },
      },
      selectionRange: {
        start: { row: 6, column: 9 },
        end: { row: 6, column: 14 },
      },
    },
    {
      path: "C:\\Users\\azusa\\tmp\\deno_project\\mod.ts",
      name: "name3",
      icon: "type-function",
      tags: ["deprecated"],
      detail: "",
      range: {
        start: { row: 13, column: 0 },
        end: { row: 19, column: 1 },
      },
      selectionRange: {
        start: { row: 16, column: 9 },
        end: { row: 16, column: 14 },
      },
    },
  ],
}
