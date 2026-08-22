import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the simulator mode hub", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /PROJECT: FIRST LIGHT/);
  assert.match(html, /LIGHT MODE/);
  assert.match(html, /TRAINING MODE/);
  assert.match(html, /PROJECT SCENARIO MODE/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("uses the stateful five-turn template with a broad investigation space", async () => {
  const [runner, explorer, definition, actionSpace, types, advanced] = await Promise.all([
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/ScenarioActionExplorer.tsx", root), "utf8"),
    readFile(new URL("src/data/scenarios/scope-change-simulation.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/scope-change-action-space.ts", root), "utf8"),
    readFile(new URL("src/data/statefulScenarioTypes.ts", root), "utf8"),
    readFile(new URL("app/components/AdvancedSimulator.tsx", root), "utf8"),
  ]);
  assert.match(types, /interface StatefulScenarioDefinition/);
  assert.match(types, /interface StatefulScenarioTurn/);
  assert.match(types, /grantsInformation/);
  assert.match(types, /ScenarioActionRepeatPolicy/);
  assert.match(types, /outcomesByTurn/);
  assert.match(types, /delayedEffects/);
  assert.match(definition, /id: "request"[\s\S]*id: "impact"[\s\S]*id: "alignment"[\s\S]*id: "consequence"[\s\S]*id: "release"/);
  assert.match(definition, /formalCommitment/);
  assert.match(definition, /StakeholderReactionRule|reactionRules/);
  assert.match(runner, /DECISION CHAIN/);
  assert.match(runner, /INFORMATION REVIEW/);
  assert.match(runner, /STAKEHOLDER VOICES/);
  assert.match(runner, /investigationsLeft/);
  assert.match(runner, /difficulty === "guided" \? 3 : 2/);
  assert.match(runner, /sourceActionsByInformation/);
  assert.match(explorer, /誰に聞きますか？/);
  assert.match(explorer, /何を確認しますか？/);
  for (const category of ["hearing", "schedule", "risk", "scope", "team", "report"]) assert.match(actionSpace, new RegExp(`id: "${category}"`));
  const concreteActions = actionSpace.split("export const scopeChangeActionSpace")[1];
  assert.equal((concreteActions.match(/^    id: "/gm) ?? []).length, 20, "scope scenario should expose twenty concrete actions per turn");
  assert.equal((concreteActions.match(/availableFromTurn: 1/g) ?? []).length, 20, "all concrete actions should remain selectable from every turn");
  assert.match(definition, /actions: scopeChangeActionSpace/);
  assert.match(actionSpace, /repeatPolicy: "once"/);
  assert.match(actionSpace, /repeatPolicy: "per-turn"/);
  assert.match(actionSpace, /repeatPolicy: "always"/);
  assert.match(definition, /newlyRelevantActionIds/);
  assert.match(advanced, /mode === "project" && scenarioId === "scope-change"/);
});

test("renders the stateful scenario through the canonical LIGHT cockpit", async () => {
  const [runner, cockpit, result, accessibleDialog] = await Promise.all([
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorCockpit.tsx", root), "utf8"),
    readFile(new URL("app/components/ResultStep.tsx", root), "utf8"),
    readFile(new URL("app/components/AccessibleDialog.tsx", root), "utf8"),
  ]);
  assert.match(runner, /<SimulatorCockpit/);
  assert.match(runner, /actions=\{pmActions\}/);
  assert.match(runner, /<ActionDetailModal/);
  assert.match(runner, /<ActionConfirmDialog/);
  assert.match(runner, /<ProjectLog/);
  assert.match(runner, /presentation="dialog"/);
  assert.match(runner, /ScenarioActionExplorer/);
  assert.doesNotMatch(runner, /phase === "situation"|phase === "decision"|phase === "result"/);
  assert.match(cockpit, /canonical-cockpit-grid/);
  assert.match(result, /presentation === "dialog"/);
  assert.match(accessibleDialog, /event\.key !== "Tab"/);
  assert.match(accessibleDialog, /previousFocusRef/);
});

test("keeps the light-mode decision loop intact", async () => {
  const [page, hub, simulator, decisionStep, cockpit, actions, actionDetail, confirmDialog, resultStep, projectLog] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"), readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"), readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"), readFile(new URL("app/components/DecisionStep.tsx", root), "utf8"), readFile(new URL("app/components/SimulatorCockpit.tsx", root), "utf8"), readFile(new URL("app/data/actions.ts", root), "utf8"), readFile(new URL("app/components/ActionDetailModal.tsx", root), "utf8"), readFile(new URL("app/components/ActionConfirmDialog.tsx", root), "utf8"), readFile(new URL("app/components/ResultStep.tsx", root), "utf8"), readFile(new URL("app/components/ProjectLog.tsx", root), "utf8"),
  ]);
  assert.match(page, /<SimulatorHub/);
  assert.match(hub, /<PMSimulator/);
  assert.match(simulator, /<FlowSteps/);
  assert.match(simulator, /flowStep === "situation".*<SituationStep/s);
  assert.match(simulator, /flowStep === "decision".*<DecisionStep/s);
  assert.match(simulator, /flowStep === "result".*<ResultStep/s);
  assert.match(simulator, /<ActionDetailModal/);
  assert.match(simulator, /<ActionConfirmDialog/);
  assert.match(simulator, /setShowContacts\(false\);\s*setSelected\(personId\)/);
  assert.match(simulator, /log\.turn === game\.turn/);
  assert.match(simulator, /<ProjectLog/);
  assert.match(decisionStep, /<SimulatorCockpit/);
  assert.match(cockpit, /<ProjectMetrics/);
  assert.match(cockpit, /<ActionGrid/);
  assert.match(actions, /learningByArea/);
  assert.match(actionDetail, /<AccessibleDialog/);
  assert.match(confirmDialog, /<AccessibleDialog/);
  assert.match(resultStep, /PMBOK LEARNING/);
  assert.match(projectLog, /DAY \{log\.day\}/);
  assert.match(projectLog, /displayLimit/);
});

test("keeps v2 scenarios data-driven and separates learning from behavior review", async () => {
  const [hub, runner, types, scenarioIndex, scope, schedule, resources, stakeholders] = await Promise.all([
    readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"), readFile(new URL("app/components/AdvancedSimulator.tsx", root), "utf8"), readFile(new URL("src/data/types.ts", root), "utf8"), readFile(new URL("src/data/scenarios/index.ts", root), "utf8"), readFile(new URL("src/data/scenarios/scope-change.ts", root), "utf8"), readFile(new URL("src/data/scenarios/schedule-crisis.ts", root), "utf8"), readFile(new URL("src/data/scenarios/keyperson-exit.ts", root), "utf8"), readFile(new URL("src/data/scenarios/stakeholder-conflict.ts", root), "utf8"),
  ]);
  assert.match(hub, /<AdvancedSimulator/);
  assert.match(hub, /mode-\$\{view\}/);
  assert.match(hub, /window\.scrollTo/);
  assert.match(runner, /WHAT HAPPENED/);
  assert.match(runner, /PMBOK REVIEW/);
  assert.match(runner, /YOUR PM STYLE/);
  assert.match(types, /interface ProjectState/);
  assert.match(types, /interface HiddenState/);
  assert.match(types, /interface BehaviorStandardEvidence/);
  assert.doesNotMatch(types, /competencyLevel|estimatedLevel|levelHint/);
  assert.match(scenarioIndex, /scopeChangeScenario/);
  for (const scenario of [scope, schedule, resources, stakeholders]) {
    assert.match(scenario, /events:/);
    assert.match(scenario, /behaviorEvidence:/);
    assert.match(scenario, /resolveConsequence/);
  }
});
