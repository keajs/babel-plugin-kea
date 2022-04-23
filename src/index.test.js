/* global test */
import { transform } from "@babel/core";
import keaPlugin from "./index";

test("it works", () => {
  const oldCode = `
  const logic = kea({
    actions: { doit: true, }
  })
  `;

  const { code } = transform(oldCode, {
    envName: "production",
    code: true,
    babelrc: false,
    configFile: false,
    filename: "scenes/page/index.ts",
    // presets: [["env", { targets: { node: process.versions.node } }]],
    plugins: [keaPlugin],
  });
  expect(code).toMatchSnapshot();
});
