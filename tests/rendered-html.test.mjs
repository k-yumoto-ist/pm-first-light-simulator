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

test("keeps the three-step decision loop in reusable product components", async () => {
  const [page, simulator, actions, situationStep, decisionStep, actionGrid, actionDetail, confirmDialog, resultStep, projectLog] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"),
    readFile(new URL("app/data/actions.ts", root), "utf8"),
    readFile(new URL("app/components/SituationStep.tsx", root), "utf8"),
    readFile(new URL("app/components/DecisionStep.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionGrid.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionDetailModal.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionConfirmDialog.tsx", root), "utf8"),
    readFile(new URL("app/components/ResultStep.tsx", root), "utf8"),
    readFile(new URL("app/components/ProjectLog.tsx", root), "utf8"),
  ]);
  assert.match(page, /<PMSimulator/);
  assert.match(simulator, /<FlowSteps/);
  assert.match(simulator, /flowStep === "situation".*<SituationStep/s);
  assert.match(simulator, /flowStep === "decision".*<DecisionStep/s);
  assert.match(simulator, /flowStep === "result".*<ResultStep/s);
  assert.match(simulator, /<ActionDetailModal/);
  assert.match(simulator, /<ActionConfirmDialog/);
  assert.match(simulator, /setShowContacts\(false\);\s*setSelected\(personId\)/);
  assert.match(simulator, /log\.turn === game\.turn/);
  assert.match(simulator, /const scrollPageToTop/);
  assert.match(simulator, /setFlowStep\("situation"\).*scrollPageToTop\(\)/s);
  assert.match(simulator, /<ProjectLog/);
  assert.match(actions, /learningByArea/);
  assert.doesNotMatch(situationStep, /PMアクション一覧/);
  assert.match(situationStep, /まだわかっていないこと/);
  assert.match(decisionStep, /PMとして、次に何をしますか/);
  assert.match(actionGrid, /PMアクション一覧/);
  assert.match(actionDetail, /期待できる影響/);
  assert.match(actionDetail, /event\.key !== "Tab"/);
  assert.match(confirmDialog, /残りAction/);
  assert.match(confirmDialog, /event\.key !== "Tab"/);
  assert.match(resultStep, /なぜこの結果になった/);
  assert.match(resultStep, /PMBOK LEARNING/);
  assert.match(projectLog, /DAY \{log\.day\}/);
  assert.match(projectLog, /displayLimit/);
  assert.match(projectLog, /すべての判断を見る/);
});
