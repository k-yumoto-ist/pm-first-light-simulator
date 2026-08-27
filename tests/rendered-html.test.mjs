import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateInformationScore, calculateOutcomeScore, getScenarioActionUsageKey, resolveScenarioActionOutcome } from "../src/data/statefulScenarioLogic.mjs";

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
  assert.match(html, /ライトモード/);
  assert.match(html, /トレーニングモード/);
  assert.match(html, /プロジェクトシナリオ/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("uses the stateful five-turn template with a broad investigation space", async () => {
  const [runner, explorer, definition, actionSpace, categories, registry, types, advanced] = await Promise.all([
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/ScenarioActionExplorer.tsx", root), "utf8"),
    readFile(new URL("src/data/scenarios/scope-change-simulation.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/scope-change-action-space.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/stateful-action-categories.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/stateful-project-scenarios.ts", root), "utf8"),
    readFile(new URL("src/data/statefulScenarioTypes.ts", root), "utf8"),
    readFile(new URL("app/components/AdvancedSimulator.tsx", root), "utf8"),
  ]);
  assert.match(types, /interface StatefulScenarioDefinition/);
  assert.match(types, /interface StatefulScenarioTurn/);
  assert.match(types, /grantsInformation/);
  assert.match(types, /ScenarioActionRepeatPolicy/);
  assert.match(types, /outcomesByTurn/);
  assert.match(types, /ScenarioActionConditionalOutcome/);
  assert.match(types, /scoredInformation/);
  assert.match(types, /scoreMetrics/);
  assert.match(types, /delayedEffects/);
  assert.match(definition, /id: "request"[\s\S]*id: "impact"[\s\S]*id: "alignment"[\s\S]*id: "consequence"[\s\S]*id: "release"/);
  assert.match(definition, /formalCommitment/);
  assert.match(definition, /StakeholderReactionRule|reactionRules/);
  assert.match(runner, /判断の連鎖/);
  assert.match(runner, /情報収集の振り返り/);
  assert.match(runner, /関係者の声/);
  assert.match(runner, /investigationsLeft/);
  assert.match(runner, /difficulty === "guided" \? 3 : 2/);
  assert.match(runner, /sourceActionsByInformation/);
  assert.match(explorer, /誰に聞きますか？/);
  assert.match(explorer, /何を確認しますか？/);
  for (const category of ["hearing", "schedule", "risk", "scope", "team", "report"]) assert.match(categories, new RegExp(`id: "${category}"`));
  const concreteActions = actionSpace.split("export const scopeChangeActionSpace")[1];
  assert.equal((concreteActions.match(/^    id: "/gm) ?? []).length, 20, "scope scenario should expose twenty concrete actions per turn");
  assert.equal((concreteActions.match(/availableFromTurn: 1/g) ?? []).length, 20, "all concrete actions should remain selectable from every turn");
  assert.match(definition, /actions: scopeChangeActionSpace/);
  assert.match(actionSpace, /repeatPolicy: "once"/);
  assert.match(actionSpace, /repeatPolicy: "per-turn"/);
  assert.doesNotMatch(actionSpace, /repeatPolicy: "always"/);
  assert.match(definition, /newlyRelevantActionIds/);
  for (const id of ["scope-change", "schedule-crisis", "keyperson-exit", "stakeholder-conflict"]) assert.match(registry, new RegExp(`"${id}"`));
  assert.match(advanced, /getStatefulProjectScenario\(scenarioId\)/);
  assert.doesNotMatch(advanced, /scenarioId === "scope-change"/);
});

test("defines all four PROJECT scenarios for the shared Stateful runner", async () => {
  const definitions = [
    ["scope-change", "scope-change-simulation.ts", "scope-change-action-space.ts"],
    ["schedule-crisis", "schedule-crisis-simulation.ts", "schedule-crisis-action-space.ts"],
    ["keyperson-exit", "keyperson-exit-simulation.ts", "keyperson-exit-action-space.ts"],
    ["stakeholder-conflict", "stakeholder-conflict-simulation.ts", "stakeholder-conflict-action-space.ts"],
  ];
  const causalActionIds = {
    "scope-change": "scope_phased_option",
    "schedule-crisis": "sch_scope_release_option",
    "keyperson-exit": "kp_team_distribute",
    "stakeholder-conflict": "scf_scope_success",
  };
  for (const [id, simulationFile, actionFile] of definitions) {
    const [simulation, actions] = await Promise.all([
      readFile(new URL(`src/data/scenarios/${simulationFile}`, root), "utf8"),
      readFile(new URL(`src/data/scenarios/${actionFile}`, root), "utf8"),
    ]);
    assert.equal((simulation.match(/timing:/g) ?? []).length, 5, `${id} should have five turns`);
    const actionCount = (actions.match(/availableFromTurn: 1/g) ?? []).length;
    assert.ok(actionCount >= 18, `${id} should expose at least eighteen concrete actions broadly from turn one`);
    for (const marker of ["stakeholders:", "information:", "decisions:", "delayedEffects", "reactionRules:", "resultConfig:", "requiresInformation", "irreversible: true"]) assert.match(simulation, new RegExp(marker), `${id} missing ${marker}`);
    assert.match(actions, /grantsInformation: \[\]/, `${id} should include a low-value or wrong-source action`);
    assert.match(simulation, /scoredInformation:/, `${id} should define weighted important information`);
    assert.match(simulation, /scoreMetrics:/, `${id} should define weighted outcome metrics`);
    assert.match(actions, /conditionalOutcomes:/, `${id} should include FACT to FINDING or OPTION causality`);
    assert.doesNotMatch(actions, /repeatPolicy: "always"/, `${id} should prevent same-turn repeat reporting`);
    assert.match(actions, new RegExp(`id: "${causalActionIds[id]}"[\\s\\S]{0,1200}?repeatPolicy: "per-turn"[\\s\\S]{0,500}?grantsInformation: \\[\\][\\s\\S]{0,1200}?conditionalOutcomes:[\\s\\S]{0,500}?requiresInformation:[\\s\\S]{0,500}?grantsInformation: \\[[^\\]]+\\]`), `${id} should withhold a representative FINDING or OPTION until its facts are acquired, then allow a later-turn retry`);

    const quotedIds = (text) => [...text.matchAll(/"([a-z0-9_]+)"/g)].map(match => match[1]);
    const block = (text, start, end) => text.match(new RegExp(`${start}:\\s*\\[([\\s\\S]*?)\\],\\s*${end}:`))?.[1] ?? "";
    const informationIds = new Set([...block(simulation, "information", "actions").matchAll(/id:\s*"([^"]+)"/g)].map(match => match[1]));
    const stakeholderIds = new Set([...block(simulation, "stakeholders", "actionCategories").matchAll(/id:\s*"([^"]+)"/g)].map(match => match[1]));
    const actionIds = new Set([...actions.matchAll(/\bid:\s*"([^"]+)"/g)].map(match => match[1]));
    for (const match of actions.matchAll(/grantsInformation:\s*\[([^\]]*)\]/g)) for (const informationId of quotedIds(match[1])) assert.ok(informationIds.has(informationId), `${id} action references unknown information ${informationId}`);
    for (const match of actions.matchAll(/requiresInformation:\s*\[([^\]]*)\]/g)) for (const informationId of quotedIds(match[1])) assert.ok(informationIds.has(informationId), `${id} action condition references unknown information ${informationId}`);
    const scoredInformationBlock = simulation.match(/scoredInformation:\s*\[([\s\S]*?)\],\s*informationFullCreditRatio/)?.[1] ?? "";
    for (const informationId of [...scoredInformationBlock.matchAll(/id:\s*"([^"]+)"/g)].map(match => match[1])) assert.ok(informationIds.has(informationId), `${id} scores unknown information ${informationId}`);
    for (const match of simulation.matchAll(/requiresInformation:\s*\[([^\]]*)\]/g)) for (const informationId of quotedIds(match[1])) assert.ok(informationIds.has(informationId), `${id} decision references unknown information ${informationId}`);
    for (const match of actions.matchAll(/stakeholderId:\s*"([^"]+)"/g)) assert.ok(stakeholderIds.has(match[1]), `${id} action references unknown stakeholder ${match[1]}`);
    for (const match of simulation.matchAll(/newlyRelevantActionIds:\s*\[([^\]]*)\]/g)) for (const actionId of quotedIds(match[1])) assert.ok(actionIds.has(actionId), `${id} turn references unknown action ${actionId}`);

    const initialFlags = simulation.match(/initialFlags:\s*\{([\s\S]*?)\},\s*intro:/)?.[1] ?? "";
    const knownFlags = new Set([...initialFlags.matchAll(/([A-Za-z][A-Za-z0-9]*):/g)].map(match => match[1]));
    for (const text of [simulation, actions]) for (const match of text.matchAll(/setsFlags:\s*\{([^}]*)\}/g)) for (const key of match[1].matchAll(/([A-Za-z][A-Za-z0-9]*):/g)) knownFlags.add(key[1]);
    for (const match of simulation.matchAll(/requiresAll:\s*\[([^\]]*)\]/g)) for (const flag of quotedIds(match[1])) assert.ok(knownFlags.has(flag), `${id} condition references information or unknown flag ${flag}`);
  }
});

test("scores important information and scenario metrics by weight", () => {
  const important = [{ id: "critical", weight: 3 }, { id: "decision", weight: 2 }, { id: "minor", weight: 1 }];
  assert.equal(calculateInformationScore(["critical", "decision"], important, 0.8), 100, "80 percent of weighted information should earn full credit");
  assert.equal(calculateInformationScore(["minor"], important, 0.8), 21, "low-value information alone must not earn a high score");
  assert.equal(calculateInformationScore(["noise_a", "noise_b", "noise_c"], important, 0.8), 0, "unscored information must not inflate the score");
  assert.equal(calculateOutcomeScore({ schedule: 80, quality: 60, riskExposure: 20 }, [{ key: "schedule", weight: 2 }, { key: "quality", weight: 1 }, { key: "riskExposure", weight: 1 }]), 75);
});

test("resolves the same Action differently from acquired facts and limits per-turn repeats", () => {
  const action = {
    id: "build_option", repeatPolicy: "per-turn", grantsInformation: [], result: "一般的な案に留まりました。", whyThisResult: "前提情報が不足しています。",
    conditionalOutcomes: [{ requiresInformation: ["fact_a", "fact_b"], grantsInformation: ["option"], result: "具体的な案を作りました。", whyThisResult: "必要な事実を確認していたためです。" }],
  };
  const missing = resolveScenarioActionOutcome(action, 1, ["fact_a"], {});
  assert.deepEqual(missing.grantsInformation, []);
  assert.deepEqual(missing.missingInformation, ["fact_b"]);
  const complete = resolveScenarioActionOutcome(action, 1, ["fact_a", "fact_b"], {});
  assert.deepEqual(complete.grantsInformation, ["option"]);
  assert.equal(complete.usedConditionalOutcome, true);
  assert.equal(getScenarioActionUsageKey(action, 1), "1:build_option");
  assert.equal(getScenarioActionUsageKey(action, 2), "2:build_option", "a per-turn Action becomes available on the next turn");
});

test("keeps Action codes internal and out of player-facing components", async () => {
  const [grid, detail, runner] = await Promise.all([
    readFile(new URL("app/components/ActionGrid.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionDetailModal.tsx", root), "utf8"),
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
  ]);
  const playerFacing = `${grid}\n${detail}\n${runner}`;
  assert.doesNotMatch(playerFacing, /action\.code|\.find\([^\n]+\)\?\.code/);
  assert.doesNotMatch(playerFacing, />\s*(?:STK|SCH|RSK|SCP|TEM|COM)\s*</);
});

test("keeps the five release choices readable without shrinking descriptions to one character", async () => {
  const styles = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(styles, /\.scenario-choice-dialog \.decision-choice-list\.release-list button \{ grid-template-columns:minmax\(0,1fr\); \}/);
  assert.match(styles, /\.scenario-choice-dialog \.decision-choice-list\.release-list button span,\.scenario-choice-dialog \.decision-choice-list\.release-list button b \{ grid-column:1\/-1; min-width:0; \}/);
});

test("renders the stateful scenario through the canonical LIGHT flow", async () => {
  const [runner, cockpit, result, finalResult, accessibleDialog, chat, intro] = await Promise.all([
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorCockpit.tsx", root), "utf8"),
    readFile(new URL("app/components/ResultStep.tsx", root), "utf8"),
    readFile(new URL("app/components/FinalResultFramework.tsx", root), "utf8"),
    readFile(new URL("app/components/AccessibleDialog.tsx", root), "utf8"),
    readFile(new URL("app/components/StakeholderChatDrawer.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorIntro.tsx", root), "utf8"),
  ]);
  assert.match(runner, /<SimulatorCockpit/);
  assert.match(runner, /actions=\{pmActions\}/);
  assert.match(runner, /<ActionDetailModal/);
  assert.match(runner, /<ActionConfirmDialog/);
  assert.match(runner, /<ProjectLog/);
  assert.match(runner, /ScenarioActionExplorer/);
  assert.match(runner, /<FlowSteps/);
  assert.match(runner, /phase === "situation"[\s\S]*<SituationStep/);
  assert.match(runner, /phase === "result"[\s\S]*<ResultStep/);
  assert.match(runner, /<StakeholderContactPicker/);
  assert.match(runner, /<StakeholderChatDrawer/);
  assert.match(runner, /<SimulatorIntro/);
  assert.match(runner, /usageCounts=\{actionUsageCounts\}/);
  assert.match(runner, /今回の必須判断/);
  assert.doesNotMatch(runner, /presentation="dialog"/);
  assert.doesNotMatch(runner, /sideContent=/);
  assert.match(runner, /showInformation/);
  assert.match(runner, /showProjectDetails/);
  assert.match(runner, /<FinalResultFramework mode=\{scenario\.mode\}/);
  assert.match(cockpit, /canonical-cockpit-grid/);
  assert.match(result, /presentation === "dialog"/);
  assert.match(finalResult, /総合スコア/);
  assert.match(finalResult, /あなたの判断スタイル/);
  assert.match(finalResult, /type OutcomeSummaryItem/);
  assert.match(finalResult, /結果サマリー/);
  assert.match(finalResult, /final-outcome-summary/);
  assert.match(runner, /outcomeSummary=\{outcomeSummary\}/);
  assert.match(accessibleDialog, /event\.key !== "Tab"/);
  assert.match(accessibleDialog, /previousFocusRef/);
  assert.match(chat, /chat-drawer/);
  assert.match(chat, /onSelectQuestion/);
  assert.match(chat, /<AccessibleDialog/);
  assert.match(intro, /プロジェクト概要/);
  assert.match(runner, /exitLabel="テーマ選択へ戻る" onExit=\{\(\) => onExit\(false\)\}/);
  assert.match(runner, /<PlayNavigationMenu/);
  assert.match(runner, /type StatefulSnapshot/);
});

test("provides seven three-turn Stateful trainings on the shared runner", async () => {
  const trainingFiles = [
    "governance-training.ts",
    "scope-training.ts",
    "schedule-training.ts",
    "finance-training.ts",
    "stakeholder-training.ts",
    "resource-training.ts",
    "risk-training.ts",
  ];
  const [registry, advanced, hub, runner, framework, ...definitions] = await Promise.all([
    readFile(new URL("src/data/training/training-scenarios.ts", root), "utf8"),
    readFile(new URL("app/components/AdvancedSimulator.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"),
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/FinalResultFramework.tsx", root), "utf8"),
    ...trainingFiles.map(file => readFile(new URL(`src/data/training/${file}`, root), "utf8")),
  ]);
  for (const id of ["governance", "scope", "schedule", "finance", "stakeholder", "resource", "risk"]) {
    assert.match(registry, new RegExp(`"${id}-training"`), `${id} training should be registered`);
  }
  assert.match(advanced, /getStatefulTrainingScenario\(scenarioId\)/);
  assert.match(hub, /trainingScenarioCards\.map/);
  assert.doesNotMatch(hub, /available: false|準備中/);
  assert.match(runner, /scenario\.resultConfig\.scoreWeights/);
  assert.match(runner, /scenario\.mode === "training"[\s\S]*outcome: \.3, decision: \.4, information: \.3/);
  assert.match(runner, /今回身につけたい3つの行動/);
  assert.match(runner, /hearingStakeholderIds/);
  assert.match(runner, /acquiredImportant/);
  assert.match(runner, /mode=\{scenario\.mode\}/);
  assert.match(framework, /style\?: PMStyle/);
  assert.match(framework, /\{style \?/);

  for (const [index, definition] of definitions.entries()) {
    const label = trainingFiles[index];
    assert.match(definition, /mode: "training"/, `${label} should use training mode`);
    assert.equal((definition.match(/timing:/g) ?? []).length, 3, `${label} should have three turns`);
    const actionCount = (definition.match(/\baction\(/g) ?? []).length;
    assert.ok(actionCount >= 10 && actionCount <= 14, `${label} should expose ten to fourteen concrete actions`);
    for (const category of ["hearing", "schedule", "risk", "scope", "team", "report"]) assert.match(definition, new RegExp(`(?:category:\\s*)?"${category}"`), `${label} missing ${category}`);
    assert.match(definition, /conditionalOutcomes:/, `${label} should include FACT to FINDING or OPTION causality`);
    assert.match(definition, /grantsInformation: \[\]|lowValueActionIds|情報源/, `${label} should include a low-value or wrong-source action`);
    assert.match(definition, /scoredInformation:/, `${label} should weight important information`);
    assert.match(definition, /scoreMetrics:/, `${label} should weight theme outcomes`);
    assert.match(definition, /evidence:\s*(?:decisionEvidence\[|\[\{)/, `${label} should score effective decisions`);
  }
  const scheduleDefinition = definitions[2];
  assert.match(scheduleDefinition, /sch_team_overtime[\s\S]{0,300}grantsInformation:\s*\["quality_floor"\]/, "schedule training should make the quality floor reachable");
  assert.match(registry, /scoreWeights:[\s\S]*outcome: 0\.3[\s\S]*decision: 0\.4[\s\S]*information: 0\.3/);
  assert.match(registry, /learningActions/);
});

test("keeps the light-mode decision loop intact", async () => {
  const [page, hub, simulator, decisionStep, cockpit, actions, actionDetail, confirmDialog, resultStep, projectLog, chat, intro] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"), readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"), readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"), readFile(new URL("app/components/DecisionStep.tsx", root), "utf8"), readFile(new URL("app/components/SimulatorCockpit.tsx", root), "utf8"), readFile(new URL("app/data/actions.ts", root), "utf8"), readFile(new URL("app/components/ActionDetailModal.tsx", root), "utf8"), readFile(new URL("app/components/ActionConfirmDialog.tsx", root), "utf8"), readFile(new URL("app/components/ResultStep.tsx", root), "utf8"), readFile(new URL("app/components/ProjectLog.tsx", root), "utf8"), readFile(new URL("app/components/StakeholderChatDrawer.tsx", root), "utf8"), readFile(new URL("app/components/SimulatorIntro.tsx", root), "utf8"),
  ]);
  assert.match(page, /<SimulatorHub/);
  assert.match(hub, /<PMSimulator/);
  assert.match(hub, /modeThemes\.light\.className/);
  assert.match(simulator, /<FlowSteps/);
  assert.match(simulator, /flowStep === "situation".*<SituationStep/s);
  assert.match(simulator, /flowStep === "decision".*<DecisionStep/s);
  assert.match(simulator, /flowStep === "result".*<ResultStep/s);
  assert.match(simulator, /<ActionDetailModal/);
  assert.match(simulator, /<ActionConfirmDialog/);
  assert.match(simulator, /setShowContacts\(false\);\s*setSelected\(personId\)/);
  assert.match(simulator, /log\.turn === game\.turn/);
  assert.match(simulator, /<ProjectLog/);
  assert.match(simulator, /<FinalResultFramework mode="light"/);
  assert.match(simulator, /label: "リリース"/);
  assert.match(simulator, /outcomeSummary=\{outcomeSummary\}/);
  assert.match(simulator, /<StakeholderChatDrawer/);
  assert.match(simulator, /<StakeholderContactPicker/);
  assert.match(simulator, /<SimulatorIntro/);
  assert.match(decisionStep, /<SimulatorCockpit/);
  assert.match(cockpit, /<ProjectMetrics/);
  assert.match(cockpit, /<ActionGrid/);
  assert.match(actions, /learningByArea/);
  assert.match(actionDetail, /<AccessibleDialog/);
  assert.match(confirmDialog, /<AccessibleDialog/);
  assert.match(resultStep, /PMBOKでの学び/);
  assert.match(projectLog, /\{log\.day\}日目/);
  assert.match(projectLog, /displayLimit/);
  assert.match(chat, /StakeholderChatQuestion/);
  assert.match(chat, /<AccessibleDialog/);
  assert.match(intro, /intro-shell/);
});

test("restores saved result screens without rendering a blank simulator", async () => {
  const [session, light, stateful, hub, projectRegistry] = await Promise.all([
    readFile(new URL("app/lib/playSession.ts", root), "utf8"),
    readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"),
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"),
    readFile(new URL("src/data/scenarios/stateful-project-scenarios.ts", root), "utf8"),
  ]);
  assert.match(session, /PLAY_SAVE_VERSION = 3/);
  assert.match(session, /isSavedSession/);
  assert.match(light, /type LightSnapshot = \{[^}]*actionResult: ActionResult \| null/);
  assert.match(light, /JSON\.stringify\(\{ game, flowStep, recentChanges, actionResult \}\)/);
  assert.match(light, /requestedFlowStep === "result" && !actionResult \? "decision"/);
  assert.match(stateful, /value\.phase === "result" && !resultDialog \? "cockpit"/);
  assert.match(stateful, /normalizeStatefulSnapshot\(savedState\?\.snapshot, scenario\.turns\.length\)/);
  assert.match(hub, /getStatefulTrainingScenario\(savedPlay\.scenarioId\)/);
  assert.match(hub, /getStatefulProjectScenario\(savedPlay\.scenarioId\)/);
  assert.match(hub, /getSavedScenarioLabel\(savedPlay\)/);
  assert.match(projectRegistry, /Object\.values\(statefulProjectScenarios\)\.find\(\(scenario\) => scenario\.id === id\)/);
});

test("supports multiple local saves, migration, individual deletion, and scoped completion cleanup", async () => {
  const [session, menu, hub, light, stateful] = await Promise.all([
    readFile(new URL("app/lib/playSession.ts", root), "utf8"),
    readFile(new URL("app/components/PlayNavigationMenu.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"),
    readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"),
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
  ]);
  assert.match(session, /export function saveGame/);
  assert.match(session, /export function loadGames/);
  assert.match(session, /export function loadGame/);
  assert.match(session, /export function deleteSave/);
  assert.match(session, /export function hasSaveData/);
  assert.match(session, /window\.localStorage\.setItem\(SAVED_GAMES_KEY/);
  assert.match(session, /JSON\.parse/);
  assert.match(session, /migrateLegacyIfNeeded/);
  assert.match(session, /saves\.filter\(\(save\) => save\.id !== id\)/);
  assert.match(menu, /プレイ状況を保存しました/);
  assert.match(menu, /role="status" aria-live="polite"/);
  assert.match(hub, /続きからプレイ/);
  assert.match(hub, /保存したプレイ一覧/);
  assert.match(hub, /savedGames\.map/);
  assert.match(hub, /この保存データを削除しますか/);
  assert.match(light, /if \(activeSaveId\) deleteSave\(activeSaveId\)/);
  assert.match(stateful, /if \(activeSaveId\) deleteSave\(activeSaveId\)/);
  assert.doesNotMatch(light, /else clearPlaySession/);
  assert.doesNotMatch(stateful, /else clearPlaySession/);
});

test("renders causal decision analysis instead of a flat decision log", async () => {
  const [analysis, timeline, light, stateful, styles] = await Promise.all([
    readFile(new URL("app/lib/decisionAnalysis.ts", root), "utf8"),
    readFile(new URL("app/components/DecisionAnalysisTimeline.tsx", root), "utf8"),
    readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"),
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.match(analysis, /buildDecisionAnalysis/);
  assert.match(analysis, /summarizeDecisionAnalysis/);
  assert.match(timeline, /今回の判断傾向/);
  assert.match(timeline, /あなたの判断/);
  assert.match(timeline, /直後に起きたこと/);
  assert.match(timeline, /後から発生した影響/);
  assert.match(timeline, /学習ポイント/);
  assert.match(timeline, /良かった判断/);
  assert.match(timeline, /見直せそうな判断/);
  assert.match(light, /<DecisionAnalysisTimeline/);
  assert.match(stateful, /<DecisionAnalysisTimeline/);
  assert.match(styles, /\.decision-timeline-item/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});

test("keeps v2 scenarios data-driven and separates learning from behavior review", async () => {
  const [hub, runner, finalResult, themes, types, scenarioIndex, scope, schedule, resources, stakeholders] = await Promise.all([
    readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"), readFile(new URL("app/components/AdvancedSimulator.tsx", root), "utf8"), readFile(new URL("app/components/FinalResultFramework.tsx", root), "utf8"), readFile(new URL("app/data/modeThemes.ts", root), "utf8"), readFile(new URL("src/data/types.ts", root), "utf8"), readFile(new URL("src/data/scenarios/index.ts", root), "utf8"), readFile(new URL("src/data/scenarios/scope-change.ts", root), "utf8"), readFile(new URL("src/data/scenarios/schedule-crisis.ts", root), "utf8"), readFile(new URL("src/data/scenarios/keyperson-exit.ts", root), "utf8"), readFile(new URL("src/data/scenarios/stakeholder-conflict.ts", root), "utf8"),
  ]);
  assert.match(hub, /<AdvancedSimulator/);
  assert.match(hub, /modeThemeStyle/);
  assert.match(hub, /window\.scrollTo/);
  assert.match(runner, /起きたこと/);
  assert.match(runner, /PMBOKで振り返る/);
  assert.match(runner, /<FinalResultFramework mode=\{mode\}/);
  assert.match(finalResult, /あなたの判断スタイル/);
  assert.match(themes, /light:[\s\S]*training:[\s\S]*project:/);
  assert.match(themes, /--mode-accent/);
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

test("uses shared Japanese labels and health statuses in player-facing UI", async () => {
  const [labels, metrics, light, project, legacy, result, hub, explorer, chat, actionDetail, actionConfirm, scope, schedule, resources, stakeholders] = await Promise.all([
    readFile(new URL("app/data/uiLabels.ts", root), "utf8"),
    readFile(new URL("app/components/ProjectMetrics.tsx", root), "utf8"),
    readFile(new URL("app/components/PMSimulator.tsx", root), "utf8"),
    readFile(new URL("app/components/StatefulScenarioRunner.tsx", root), "utf8"),
    readFile(new URL("app/components/AdvancedSimulator.tsx", root), "utf8"),
    readFile(new URL("app/components/FinalResultFramework.tsx", root), "utf8"),
    readFile(new URL("app/components/SimulatorHub.tsx", root), "utf8"),
    readFile(new URL("app/components/ScenarioActionExplorer.tsx", root), "utf8"),
    readFile(new URL("app/components/StakeholderChatDrawer.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionDetailModal.tsx", root), "utf8"),
    readFile(new URL("app/components/ActionConfirmDialog.tsx", root), "utf8"),
    readFile(new URL("src/data/scenarios/scope-change.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/schedule-crisis.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/keyperson-exit.ts", root), "utf8"),
    readFile(new URL("src/data/scenarios/stakeholder-conflict.ts", root), "utf8"),
  ]);
  for (const status of ["順調", "注意", "警戒", "危険"]) assert.match(labels, new RegExp(status));
  for (const label of ["納期", "品質", "顧客信頼", "チーム状態", "リスク", "スコープ安定性", "関係者合意", "事業価値", "コスト"]) assert.match(labels, new RegExp(label));
  assert.match(metrics, /getMetricStatusLabel/);
  assert.match(light, /getMetricStatusLabel/);
  assert.match(project, /getMetricStatusLabel/);
  assert.doesNotMatch(`${metrics}\n${light}\n${project}`, /statusFor|summaryStatus|\"遅延\"/);
  const playerUi = [metrics, light, project, legacy, result, hub, explorer, chat, actionDetail, actionConfirm, scope, schedule, resources, stakeholders].join("\n");
  assert.doesNotMatch(playerUi, /PROJECT SCORE|PROJECT RESULT|OUTCOME SUMMARY|YOUR PM STYLE|HOW THE SCORE WAS FORMED|ACTIONS LEFT|YOUR DECISION|TURN DECISION/);
  assert.doesNotMatch(playerUi, />\s*(?:Stable|Caution|Warning|Critical)\s*</);
  assert.doesNotMatch(playerUi, /\b(?:LIGHT MODE|TRAINING MODE|PROJECT SCENARIO MODE|COMING SOON|PLAY STYLE)\b/);
  assert.match(result, /総合スコア/);
  assert.match(result, /結果サマリー/);
  assert.match(result, /あなたの判断スタイル/);
});
