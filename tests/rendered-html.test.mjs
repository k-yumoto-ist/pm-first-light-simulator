import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the PM simulation introduction", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /PROJECT: FIRST LIGHT/);
  assert.match(html, /あなたは今日から/);
  assert.match(html, /PMとして案件を始める/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps the decision loop in reusable product components", async () => {
  const [page, simulator, actions, actionList, actionDetail, confirmDialog, resultModal, projectLog] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"),
    readFile(new URL("app/data/actions.ts", root), "utf8"),
    readFile(new URL("app/components/ActionList.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionDetail.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionConfirmDialog.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionResultModal.tsx", root), "utf8"),
    readFile(new URL("app/components/ProjectLog.tsx", root), "utf8"),
  ]);
  assert.match(page, /<PMSimulator/);
  assert.match(simulator, /<FlowSteps/);
  assert.match(simulator, /<ActionList/);
  assert.match(simulator, /<ActionDetail/);
  assert.match(simulator, /<ActionConfirmDialog/);
  assert.match(simulator, /<KnownInformation/);
  assert.match(simulator, /<ProjectMetrics/);
  assert.match(simulator, /setShowContacts\(false\);\s*setSelected\(personId\)/);
  assert.match(simulator, /<ActionResultModal/);
  assert.match(simulator, /<ProjectLog/);
  assert.match(actions, /learningByArea/);
  assert.match(actionList, /PMアクション一覧/);
  assert.match(actionDetail, /期待できる影響/);
  assert.match(confirmDialog, /残りAction/);
  assert.match(resultModal, /なぜこの結果になった/);
  assert.match(resultModal, /PMBOK LEARNING/);
  assert.match(projectLog, /DAY \{log\.day\}/);
});
