"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionConfirmDialog, type ActionConfirmation } from "./ActionConfirmDialog";
import { ActionDetail } from "./ActionDetail";
import { ActionList } from "./ActionList";
import { ActionResultModal } from "./ActionResultModal";
import { FlowSteps, type FlowStep } from "./FlowSteps";
import { KnownInformation } from "./KnownInformation";
import { ProjectMetrics } from "./ProjectMetrics";
import { ProjectLog } from "./ProjectLog";
import { characters } from "../data/characters";
import { decisionResultCopy, learningByArea, pmActions, type PMActionDefinition } from "../data/actions";
import { buildFeedback } from "../data/feedback";
import { calculateScores } from "../data/scoring";
import { projectBrief, releaseChoices, requestChoices, turns } from "../data/scenario";
import { conversationEngine } from "../lib/conversationEngine";
import type { ActionLog, ActionResult, CharacterId, Effect, GameFlags, GameState, MetricChange, Metrics, ScoreKey } from "../types/game";

type PendingAction =
  | { kind: "pm"; id: PMActionDefinition["id"]; confirmation: ActionConfirmation }
  | { kind: "topic"; id: string; confirmation: ActionConfirmation }
  | { kind: "request"; id: string; confirmation: ActionConfirmation }
  | { kind: "release"; id: string; confirmation: ActionConfirmation };

const initialFlags: GameFlags = {
  decisionMakerKnown: false, apiRiskKnown: false, apiRiskMitigated: false,
  juniorProgressChecked: false, additionalRequestAccepted: false,
  requestBackgroundKnown: false, impactAnalysisDone: false,
  stakeholderAligned: false, releaseCriteriaKnown: false, priorityAdjusted: false,
  delayRecovered: false, reportedStatus: false,
};
const initialMetrics: Metrics = { schedule: 78, quality: 76, trust: 70, team: 78, scopeStability: 58, riskExposure: 52, stakeholderAlignment: 42 };
const scoreLabels: Record<ScoreKey, string> = { scope: "Scope Management", schedule: "Schedule Management", stakeholder: "Stakeholder Management", risk: "Risk Management" };
const metricLabels: Record<keyof Metrics, string> = { schedule: "Schedule", quality: "Quality", trust: "Customer Trust", team: "Team Condition", scopeStability: "Scope Clarity", riskExposure: "Risk Exposure", stakeholderAlignment: "Stakeholder Alignment" };

function makeInitialState(): GameState {
  return { phase: "intro", turn: 1, actionsLeft: 3, metrics: { ...initialMetrics }, flags: { ...initialFlags }, chats: { sato: [], takahashi: [], tanaka: [], suzuki: [] }, logs: [], asked: [], turnNotice: turns[0].situation };
}
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const statusFor = (value: number) => value >= 78 ? "順調" : value >= 60 ? "注意" : value >= 42 ? "遅延" : "危険";
const riskStatus = (value: number) => value <= 30 ? "低" : value <= 58 ? "中" : "高";
function applyEffect(state: GameState, effect?: Effect): GameState {
  if (!effect) return state;
  const metrics = { ...state.metrics };
  Object.entries(effect.metrics || {}).forEach(([key, delta]) => { metrics[key as keyof Metrics] = clamp(metrics[key as keyof Metrics] + (delta || 0)); });
  return { ...state, metrics, flags: { ...state.flags, ...(effect.flags || {}) } };
}
function getChanges(before: Metrics, after: Metrics): MetricChange[] {
  return (Object.keys(before) as (keyof Metrics)[]).filter(key => before[key] !== after[key]).map(key => ({ key, before: before[key], after: after[key] }));
}

function KPI({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const status = inverse ? riskStatus(value) : statusFor(value);
  const progress = inverse ? 100 - value : value;
  return <article className="top-kpi"><div><span>{label}</span><strong className={`status status-${status}`}>{status}</strong></div><div className="meter"><i style={{ width: `${progress}%` }} /></div></article>;
}

export default function PMSimulator() {
  const [game, setGame] = useState<GameState>(makeInitialState);
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>("situation");
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<PMActionDefinition["id"]>("hearing");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [recentChanges, setRecentChanges] = useState<MetricChange[]>([]);
  const [showScenarioChoices, setShowScenarioChoices] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<ScoreKey, number> | null>(null);

  useEffect(() => { try { const raw = localStorage.getItem("pm-simulator-last-score"); if (raw) setPreviousScores(JSON.parse(raw)); } catch {} }, []);
  const scores = useMemo(() => calculateScores(game), [game]);
  const feedback = useMemo(() => buildFeedback(game), [game]);
  const turn = turns[game.turn - 1];
  const currentCharacter = characters.find(character => character.id === selected);
  const currentTopics = selected ? conversationEngine.getTopics(selected, game) : [];
  const decisionPending = (game.turn === 2 && !game.requestDecision) || (game.turn === 4 && !game.releaseDecision);
  const explorationDisabled = Boolean(executingId) || Boolean(actionResult) || game.actionsLeft === 0 || (decisionPending && game.actionsLeft === 1);
  const selectedAction = pmActions.find(action => action.id === selectedActionId) || pmActions[0];

  const finishAction = (next: GameState, title: string, detail: string, occurred: string, why: string, learning: string, tags: ScoreKey[]) => {
    const changes = getChanges(game.metrics, next.metrics);
    const unlockedMap: { key: keyof GameFlags; copy: string }[] = [
      { key: "decisionMakerKnown", copy: "最終意思決定者：高橋部長（リリース承認者）" },
      { key: "apiRiskKnown", copy: "技術上の主要リスク：外部APIの仕様確定遅延" },
      { key: "releaseCriteriaKnown", copy: "リリース成功条件：主要機能の提供と重大障害がないこと" },
      { key: "juniorProgressChecked", copy: "若手メンバーの進捗に支援が必要な兆候" },
    ];
    const unlocked = unlockedMap.filter(item => !game.flags[item.key] && next.flags[item.key]).map(item => item.copy);
    const log: ActionLog = { id: crypto.randomUUID(), kind: "action", turn: game.turn, day: turn.day, event: game.turnNotice, label: title, detail, result: occurred, why, learning, changes, tags };
    window.setTimeout(() => {
      setGame({ ...next, actionsLeft: game.actionsLeft - 1, logs: [...game.logs, log] });
      setActionResult({ title, occurred, why, learning, changes, tags, unlocked });
      setRecentChanges(changes);
      setExecutingId(null);
      setFlowStep("result");
      setSelected(null);
      setShowContacts(false);
    }, 280);
  };

  const confirmationForAction = (action: PMActionDefinition): ActionConfirmation => ({
    title: `${action.title} — Actionを使いますか？`, description: action.description,
    aims: action.expected, impacts: action.impactHints.map(item => ({ label: item.label, direction: item.direction === "strongUp" ? "↑↑" : item.direction === "up" ? "↑" : item.direction === "down" ? "↓" : "→" })),
  });

  const preparePMAction = (action: PMActionDefinition) => {
    setSelectedActionId(action.id); setFlowStep("decision");
    if (action.id === "hearing") { setShowContacts(true); return; }
    setPendingAction({ kind: "pm", id: action.id, confirmation: confirmationForAction(action) });
  };

  const executePMAction = (id: string) => {
    if (explorationDisabled) return;
    const action = pmActions.find(item => item.id === id);
    if (!action) return;
    setFlowStep("decision");
    if (id === "hearing") { setShowContacts(true); return; }
    if (!action.getEffect || !action.getResult) return;
    setExecutingId(id);
    const copy = action.getResult(game);
    const next = applyEffect(game, action.getEffect(game));
    finishAction(next, action.title, action.description, copy.occurred, copy.why, copy.learning, action.tags);
  };

  const askTopic = (topicId: string) => {
    if (!selected || game.asked.includes(topicId) || explorationDisabled) return;
    const topic = currentTopics.find(item => item.id === topicId);
    if (!topic) return;
    setExecutingId(topic.id);
    setFlowStep("decision");
    const reply = conversationEngine.getReply(topic, game);
    const next = applyEffect(game, topic.effect);
    next.asked = [...game.asked, topic.id];
    next.chats = { ...game.chats, [selected]: [...game.chats[selected], { id: crypto.randomUUID(), speaker: "player", text: topic.playerText, turn: game.turn }, { id: crypto.randomUUID(), speaker: selected, text: reply, turn: game.turn }] };
    const primaryArea = topic.tags[0] || "stakeholder";
    const why = `「${topic.label}」と具体的に聞いたことで、曖昧な報告では得られない判断材料を引き出せました。得た情報は後続ターンの選択肢と影響を変えます。`;
    finishAction(next, `${currentCharacter?.name}さんに${topic.label}`, topic.playerText, reply, why, learningByArea[primaryArea], topic.tags);
  };

  const prepareTopic = (topicId: string) => {
    if (!selected || explorationDisabled) return;
    const topic = currentTopics.find(item => item.id === topicId);
    if (!topic) return;
    const areaLabels: Record<ScoreKey, string> = { scope: "Scope", schedule: "Schedule", stakeholder: "Stakeholder", risk: "Risk" };
    setPendingAction({ kind: "topic", id: topicId, confirmation: {
      title: `${currentCharacter?.name}さんに「${topic.label}」を聞きますか？`,
      description: topic.playerText,
      aims: ["曖昧な報告ではなく具体的な事実を得る", "後続の判断に使える不確実性を減らす"],
      impacts: topic.tags.map(tag => ({ label: areaLabels[tag], direction: "↑" })),
    } });
  };

  const chooseRequest = (id: string) => {
    if (game.requestDecision || game.actionsLeft <= 0 || executingId || actionResult) return;
    const choice = requestChoices.find(item => item.id === id); if (!choice) return;
    const effects: Record<string, Effect> = {
      accept: { flags: { additionalRequestAccepted: true }, metrics: { trust: 8, scopeStability: -20, schedule: -10, quality: -4 } },
      analyze: { flags: { impactAnalysisDone: true }, metrics: { scopeStability: 12, trust: 3, schedule: 4 } },
      later: { flags: { priorityAdjusted: true }, metrics: { scopeStability: 12, trust: -5, schedule: 6 } },
      background: { flags: { requestBackgroundKnown: true }, metrics: { scopeStability: 8, trust: 4 } },
    };
    setExecutingId(id); setFlowStep("decision");
    const next = applyEffect(game, effects[id]); next.requestDecision = id;
    const copy = decisionResultCopy[id];
    finishAction(next, choice.label, choice.note, copy.occurred, copy.why, copy.learning, ["scope", "schedule"]);
  };

  const chooseRelease = (id: string) => {
    if (game.releaseDecision || game.actionsLeft <= 0 || executingId || actionResult) return;
    const choice = releaseChoices.find(item => item.id === id); if (!choice) return;
    const aligned = game.flags.stakeholderAligned || game.flags.releaseCriteriaKnown;
    const effects: Record<string, Effect> = {
      trim: { flags: { priorityAdjusted: true }, metrics: { schedule: 14, quality: 5, trust: aligned ? 7 : -3, team: 5, scopeStability: 14 } },
      delay: { metrics: { schedule: -18, quality: 17, trust: aligned ? 5 : -8, team: 10 } },
      force: { metrics: { schedule: 8, quality: -18, trust: -8, team: -22, riskExposure: 15 } },
      negotiate: { flags: { stakeholderAligned: true }, metrics: { schedule: 4, quality: 7, trust: aligned ? 12 : 5, team: 6, stakeholderAlignment: 14 } },
      staged: { flags: { priorityAdjusted: true, stakeholderAligned: true }, metrics: { schedule: 10, quality: 12, trust: aligned ? 12 : 5, team: 7, riskExposure: -10 } },
    };
    setExecutingId(id); setFlowStep("decision");
    const next = applyEffect(game, effects[id]); next.releaseDecision = id;
    const copy = decisionResultCopy[id];
    finishAction(next, choice.label, choice.note, copy.occurred, copy.why, copy.learning, ["scope", "schedule", "stakeholder", "risk"]);
  };

  const prepareScenarioDecision = (kind: "request" | "release", id: string) => {
    const choice = (kind === "request" ? requestChoices : releaseChoices).find(item => item.id === id);
    if (!choice) return;
    const directionalHints: Record<string, { label: string; direction: string }[]> = {
      accept: [{ label: "Customer Trust", direction: "↑" }, { label: "Scope", direction: "↓" }, { label: "Schedule", direction: "↓" }],
      analyze: [{ label: "Scope", direction: "↑" }, { label: "Schedule", direction: "↑" }, { label: "Customer Trust", direction: "→" }],
      later: [{ label: "Scope", direction: "↑" }, { label: "Schedule", direction: "↑" }, { label: "Customer Trust", direction: "↓" }],
      background: [{ label: "Scope", direction: "↑" }, { label: "Customer Trust", direction: "↑" }, { label: "Schedule", direction: "→" }],
      trim: [{ label: "Schedule", direction: "↑" }, { label: "Quality", direction: "↑" }, { label: "Scope", direction: "↓" }],
      delay: [{ label: "Quality", direction: "↑" }, { label: "Team", direction: "↑" }, { label: "Schedule", direction: "↓" }],
      force: [{ label: "Schedule", direction: "↑" }, { label: "Quality", direction: "↓" }, { label: "Team", direction: "↓" }],
      negotiate: [{ label: "Customer Trust", direction: "↑" }, { label: "Quality", direction: "↑" }, { label: "Schedule", direction: "→" }],
      staged: [{ label: "Schedule", direction: "↑" }, { label: "Quality", direction: "↑" }, { label: "Risk Exposure", direction: "↓" }],
    };
    setShowScenarioChoices(false);
    setPendingAction({ kind, id, confirmation: {
      title: `「${choice.label}」と判断しますか？`, description: choice.note,
      aims: kind === "request" ? ["追加要望への初動方針を示す", "スコープ・日程・関係者への影響を選ぶ"] : ["納期・品質・スコープの優先順位を決める", "関係者へ説明できるリリース方針を持つ"],
      impacts: directionalHints[id] || [],
    } });
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.kind === "pm") executePMAction(action.id);
    if (action.kind === "topic") askTopic(action.id);
    if (action.kind === "request") { setShowScenarioChoices(false); chooseRequest(action.id); }
    if (action.kind === "release") { setShowScenarioChoices(false); chooseRelease(action.id); }
  };

  const closeResult = () => { setActionResult(null); setFlowStep("decision"); window.setTimeout(() => setRecentChanges([]), 1800); };
  const advanceTurn = () => {
    if (actionResult || executingId) return;
    if (game.turn === 2 && !game.requestDecision) return;
    if (game.turn === 4) {
      if (!game.releaseDecision) return;
      try { localStorage.setItem("pm-simulator-last-score", JSON.stringify(calculateScores(game))); } catch {}
      setGame({ ...game, phase: "result" }); setFlowStep("result"); return;
    }
    const nextTurn = game.turn + 1;
    const metricsBeforeTransition = { ...game.metrics };
    let next: GameState = { ...game, turn: nextTurn, actionsLeft: 3, turnNotice: turns[nextTurn - 1].situation };
    if (nextTurn === 2) next.turnNotice = "佐藤さんから『営業部の検索条件も追加できませんか。大きな変更ではないと思います』と連絡が入りました。";
    if (nextTurn === 3) {
      const juniorImpact = game.flags.juniorProgressChecked ? -4 : -18;
      const apiImpact = game.flags.apiRiskMitigated ? -2 : game.flags.apiRiskKnown ? -9 : -20;
      next = applyEffect(next, { metrics: { schedule: juniorImpact + apiImpact, quality: game.flags.apiRiskKnown ? -2 : -8, team: game.flags.juniorProgressChecked ? -2 : -8, riskExposure: game.flags.apiRiskMitigated ? 2 : 18 } });
      next.turnNotice = `${game.flags.juniorProgressChecked ? "鈴木さんの遅れは1日で検知できました。" : "鈴木さんのタスクが5日遅れていると判明しました。"} ${game.flags.apiRiskMitigated ? "API変更は準備済みのモックで吸収できそうです。" : game.flags.apiRiskKnown ? "懸念していたAPI仕様変更が発生し、対応策の具体化が必要です。" : "さらに、未認識だったAPI仕様変更が直撃しました。"}`;
    }
    if (nextTurn === 4) {
      next = applyEffect(next, { metrics: { team: -9, quality: game.metrics.schedule < 55 ? -7 : -2 } });
      next.turnNotice = game.flags.stakeholderAligned ? "高橋部長から『共有された選択肢をもとに判断しましょう』と連絡がありました。" : "高橋部長から『この状態で本当にリリースして問題ありませんか。私は詳しい話を聞いていません』と連絡がありました。";
    }
    const transitionChanges = getChanges(metricsBeforeTransition, next.metrics);
    if (transitionChanges.length) {
      const why = nextTurn === 3
        ? `${game.flags.juniorProgressChecked ? "進捗を早めに確認していたため、若手メンバーの遅れは小さく抑えられました。" : "進捗確認をしていなかったため、遅れが大きくなってから判明しました。"} ${game.flags.apiRiskMitigated ? "外部APIには対応策があり、変更の影響を吸収できました。" : "外部APIへの準備が不足し、変更が日程へ波及しました。"}`
        : `${game.flags.stakeholderAligned ? "意思決定者と早めに認識を合わせていたため、選択肢を共有した状態で最終判断に入れます。" : "意思決定者との認識合わせが不足し、リリース直前の説明負荷が高まりました。"}`;
      next.logs = [...game.logs, { id: crypto.randomUUID(), kind: "event", turn: nextTurn, day: turns[nextTurn - 1].day, event: next.turnNotice, label: "これまでの判断がプロジェクトへ反映", detail: "序盤の確認と準備の有無が、現在の影響差として表れました。", result: next.turnNotice, why, learning: nextTurn === 3 ? learningByArea.risk : learningByArea.stakeholder, changes: transitionChanges, tags: nextTurn === 3 ? ["schedule", "risk"] : ["stakeholder", "schedule"] }];
    }
    setGame(next); setFlowStep("situation"); setShowContacts(false); setSelected(null); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const requestAdvance = () => {
    if (game.actionsLeft > 0) { setConfirmAdvance(true); return; }
    advanceTurn();
  };
  const restart = () => {
    setPreviousScores(scores); setGame(makeInitialState()); setFlowStep("situation"); setActionResult(null);
    setSelectedActionId("hearing"); setRecentChanges([]); setPendingAction(null); setShowScenarioChoices(false); setConfirmAdvance(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (game.phase === "intro") return <main className="intro-shell"><div className="intro-glow" /><header className="brand"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span><small>PM SIMULATION</small></header><section className="hero"><p className="eyebrow">YOUR FIRST ASSIGNMENT</p><h1>あなたは今日から、<br /><em>このプロジェクトのPMです。</em></h1><p className="hero-copy">状況を読み、人に聞き、限られた時間で判断する。結果からPMの考え方を学ぶシミュレーションです。</p><div className="intro-rules"><div><b>1</b><span><strong>状況を確認</strong><small>今起きていることを読む</small></span></div><div><b>2</b><span><strong>PMとして判断</strong><small>3Actionの使い方を選ぶ</small></span></div><div><b>3</b><span><strong>結果から学ぶ</strong><small>因果とPMBOKを振り返る</small></span></div></div><p className="not-quiz">正解を当てるゲームではありません。あなたの判断で、スコープ・スケジュール・品質・チーム・関係者の状態が変化します。</p><button className="primary large" onClick={() => setGame({ ...game, phase: "playing" })}>PMとして案件を始める <span>→</span></button><p className="play-time">全4ターン・想定プレイ時間 30〜45分</p></section><section className="brief-grid"><article className="brief-main"><span className="card-kicker">PROJECT BRIEF</span><h2>{projectBrief.title}</h2><p>{projectBrief.purpose}</p></article><article><span>RELEASE</span><strong>{projectBrief.release}</strong></article><article><span>TEAM</span><strong>{projectBrief.team}</strong></article><article><span>KNOWN SCOPE</span><strong>{projectBrief.requirements}</strong></article><article className="quote"><span>FROM CUSTOMER</span><strong>{projectBrief.customer}</strong></article><article className="risk"><span>KNOWN RISK</span><strong>{projectBrief.risk}</strong><small>情報は意図的に不完全です</small></article></section></main>;

  if (game.phase === "result") {
    const avg = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 4);
    const releaseSuccess = game.metrics.schedule >= 45 && game.metrics.quality >= 45;
    const ordered = (Object.keys(scores) as ScoreKey[]).sort((a, b) => scores[b] - scores[a]);
    const counts = game.logs.reduce<Record<string, number>>((acc, log) => ({ ...acc, [log.label]: (acc[log.label] || 0) + 1 }), {});
    const frequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "状況確認";
    const biggest = game.logs.filter(log => log.kind === "action").sort((a, b) => b.changes.reduce((sum, item) => sum + Math.abs(item.after - item.before), 0) - a.changes.reduce((sum, item) => sum + Math.abs(item.after - item.before), 0))[0];
    const addressed = [game.flags.decisionMakerKnown && "意思決定者を特定", game.flags.apiRiskKnown && "外部APIリスクを把握", game.flags.juniorProgressChecked && "若手の遅れを確認", game.flags.impactAnalysisDone && "追加要望の影響を分析"].filter(Boolean) as string[];
    const missed = [!game.flags.decisionMakerKnown && "決裁者との合意", !game.flags.apiRiskKnown && "外部APIの事前確認", !game.flags.juniorProgressChecked && "若手メンバーの早期フォロー", !game.flags.impactAnalysisDone && "追加要望の影響分析"].filter(Boolean) as string[];
    return <main className="result-page"><header className="result-hero"><p className="eyebrow">PROJECT RESULT</p><h1>{releaseSuccess ? "プロジェクトは着地しました。" : "厳しい着地になりました。"}</h1><p>点数だけでなく、どの判断がこの結果を作ったかを振り返りましょう。</p></header><section className="result-summary"><div className="result-seal"><small>YOUR PM SCORE</small><strong>{avg}</strong><span>/ 100</span></div><div className="outcomes"><div><span>リリース</span><strong>{releaseSuccess ? "成功" : "課題を残して完了"}</strong></div><div><span>納期</span><strong>{statusFor(game.metrics.schedule)}</strong></div><div><span>品質</span><strong>{statusFor(game.metrics.quality)}</strong></div><div><span>顧客信頼</span><strong>{statusFor(game.metrics.trust)}</strong></div><div><span>チーム状態</span><strong>{statusFor(game.metrics.team)}</strong></div></div></section><section className="score-grid">{(Object.keys(scores) as ScoreKey[]).map(key => <article key={key}><div><span>{scoreLabels[key]}</span><strong>{scores[key]}</strong></div><div className="score-meter"><i style={{ width: `${scores[key]}%` }} /></div>{previousScores && <small className={scores[key] >= previousScores[key] ? "up" : "down"}>前回 {previousScores[key]} → 今回 {scores[key]}</small>}</article>)}</section><section className="behavior-review"><div className="section-heading"><p className="eyebrow">YOUR PM BEHAVIOR</p><h2>あなたが取ったPM行動</h2></div><div className="behavior-grid"><article><span>よく選んだ行動</span><strong>{frequent}</strong><p>今回の判断傾向を表しています。</p></article><article><span>対応できた問題</span><ul>{addressed.length ? addressed.map(item => <li key={item}>{item}</li>) : <li>明確に対応できた問題はありませんでした</li>}</ul></article><article><span>放置した問題</span><ul>{missed.length ? missed.map(item => <li key={item}>{item}</li>) : <li>主要な問題へ対応できました</li>}</ul></article><article><span>影響が大きかった判断</span><strong>{biggest?.label || "—"}</strong><p>{biggest?.why || "記録なし"}</p></article></div></section><section className="reflection"><div className="section-heading"><p className="eyebrow">FROM EXPERIENCE TO PMBOK</p><h2>あなたの行動を、PMBOKで言語化する</h2></div><div className="feedback-list">{feedback.map(item => <article key={item.area} className={item.positive ? "positive" : "lesson"}><div className="feedback-area">{scoreLabels[item.area]}</div><div><h3>{item.title}</h3><p>{item.story}</p><p className="pmbok"><b>PMBOKの観点</b>{item.lesson}</p></div></article>)}</div></section><div className="result-log"><ProjectLog logs={game.logs} /></div><section className="takeaways"><div><p className="eyebrow">THE BASICS</p><h2>今回学んだPMの基本</h2></div><ul><li>誰が意思決定者なのかを確認する</li><li>要望をそのまま受けず影響を見る</li><li>スケジュールは定期的に確認する</li><li>リスクは問題になる前に考える</li><li>プロジェクトは人との合意形成で進む</li></ul></section><section className="retry"><h2>別の判断で、もう一度挑戦しますか？</h2><p>前回と違う人に、違う質問をすると、その先の状況が変わります。</p><button className="primary large" onClick={restart}>別の判断でリトライ <span>↻</span></button></section></main>;
  }

  const canAdvance = game.turn !== 2 || Boolean(game.requestDecision);
  return <main className="simulation-shell">
    <header className="simulation-header">
      <div className="brand compact"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span></div>
      <div className="time-context"><span>DAY {turn.day}</span><strong>{turn.week}</strong><small>リリースまで {turn.remaining}日</small></div>
      <button className="log-jump" aria-expanded={showLog} onClick={() => setShowLog(true)}>PROJECT LOG <b>{game.logs.length}</b></button>
    </header>
    <FlowSteps current={flowStep} />
    <ProjectMetrics metrics={game.metrics} changes={recentChanges} />
    <section className="decision-workspace cockpit-three-pane">
      <section className="situation-pane">
        <div className="turn-label"><span>TURN {game.turn}</span><b>{turn.theme}</b></div>
        <article className="situation-card">
          <span className="priority-label">CURRENT SITUATION</span>
          <h1>{turn.title}</h1>
          <p className="situation-lead">{game.turnNotice}</p>
          <div className="consider-box"><span>PMとして考えるポイント</span><p>{turn.consider}</p></div>
        </article>
        <KnownInformation flags={game.flags} />
      </section>
      <section className="action-browser-pane">
        <header className="action-heading">
          <div><p className="eyebrow">YOUR DECISION</p><h2>PMとして、次に何を確かめますか？</h2><p>一覧から行動を選び、右側で狙いと影響を確認してください。</p></div>
          <div className="action-budget"><strong>{game.actionsLeft}</strong><span>ACTIONS<br />LEFT</span></div>
        </header>
        {(game.turn === 2 || game.turn === 4) && <button type="button" className={"scenario-decision-trigger " + (!decisionPending ? "resolved" : "")} onClick={() => decisionPending && setShowScenarioChoices(true)} disabled={!decisionPending || Boolean(executingId) || Boolean(actionResult)}>
          <span>{game.turn === 2 ? "今回の必須判断" : "リリース方針の決定"}</span>
          <strong>{game.turn === 2 ? (game.requestDecision ? requestChoices.find(choice => choice.id === game.requestDecision)?.label : "追加要望へどう返答するか") : (game.releaseDecision ? releaseChoices.find(choice => choice.id === game.releaseDecision)?.label : "どのリリース方針を選ぶか")}</strong>
          <small>{decisionPending ? "Action × 1を使って判断する" : "判断済み"}</small>
        </button>}
        <ActionList actions={pmActions} selectedId={selectedActionId} disabled={Boolean(executingId) || Boolean(actionResult)} onSelect={id => { setSelectedActionId(id); setFlowStep("decision"); }} />
      </section>
      <section className="action-detail-pane">
        <ActionDetail action={selectedAction} disabled={explorationDisabled} onExecute={() => preparePMAction(selectedAction)} />
        <footer className="turn-controls">
          <p>{decisionPending && game.actionsLeft === 1 ? "最後の1Actionは、このターンの必須判断に使います。" : game.actionsLeft === 0 ? "このターンのActionを使い切りました。" : "まだ" + game.actionsLeft + " Actions残っています。必要な情報が足りているか確認してください。"}</p>
          <button className="primary" disabled={!canAdvance || (game.turn === 4 && !game.releaseDecision) || Boolean(actionResult) || Boolean(executingId)} onClick={requestAdvance}>{game.turn === 4 ? "プロジェクト結果を見る" : "次の状況へ進む"} <span>→</span></button>
        </footer>
      </section>
    </section>
    <div id="project-log" className={"log-section " + (showLog ? "is-open" : "")} onClick={() => setShowLog(false)}><div className="log-dialog" onClick={event => event.stopPropagation()}><button className="log-close" aria-label="プロジェクトログを閉じる" onClick={() => setShowLog(false)}>閉じる ×</button><ProjectLog logs={game.logs} compact /></div></div>
    {showScenarioChoices && <div className="scenario-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setShowScenarioChoices(false); }}><section className="scenario-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="scenario-choice-title"><header><div><p>TURN DECISION</p><h2 id="scenario-choice-title">{game.turn === 2 ? "追加要望へどう返答しますか？" : "リリース方針を選んでください"}</h2></div><button type="button" onClick={() => setShowScenarioChoices(false)}>閉じる</button></header><p>正解は一つではありません。今までに得た情報と、守りたいものから判断してください。</p><div className={"decision-choice-list " + (game.turn === 4 ? "release-list" : "")}>{(game.turn === 2 ? requestChoices : releaseChoices).map(choice => <button key={choice.id} type="button" onClick={() => prepareScenarioDecision(game.turn === 2 ? "request" : "release", choice.id)}><strong>{choice.label}</strong><span>{choice.note}</span><b>この判断を詳しく確認</b></button>)}</div></section></div>}
    {showContacts && <section className="contact-picker contact-picker-overlay"><header><div><span>話す相手を選ぶ</span><small>質問を選んだ時点で Action × 1</small></div><button onClick={() => setShowContacts(false)}>閉じる</button></header><div>{characters.map(person => <button key={person.id} onClick={() => setSelected(person.id)}><span className={"avatar " + person.color}>{person.initials}</span><span><strong>{person.name}</strong><small>{person.role}</small><em>{person.status}</em></span><b>質問を見る</b></button>)}</div></section>}
    {selected && currentCharacter && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="chat-drawer" onClick={event => event.stopPropagation()}><header><span className={"avatar " + currentCharacter.color}>{currentCharacter.initials}</span><div><strong>{currentCharacter.name}</strong><small>{currentCharacter.role}</small></div><button aria-label="会話を閉じる" onClick={() => setSelected(null)}>×</button></header><div className="chat-history">{game.chats[selected].length === 0 && <div className="chat-intro"><span className={"avatar " + currentCharacter.color}>{currentCharacter.initials}</span><p>{currentCharacter.name}さんに、何を確認しますか？<br />質問の具体性で得られる情報が変わります。</p></div>}{game.chats[selected].map(message => <div key={message.id} className={"bubble " + (message.speaker === "player" ? "mine" : "theirs")}><small>{message.speaker === "player" ? "あなた" : currentCharacter.name}</small><p>{message.text}</p></div>)}</div><div className="topic-list"><div><strong>何について聞きますか？</strong><small>{decisionPending && game.actionsLeft === 1 ? "判断用Actionを確保中" : "残り " + game.actionsLeft + " Action"}</small></div>{currentTopics.map(topic => <button key={topic.id} disabled={game.asked.includes(topic.id) || explorationDisabled} onClick={() => prepareTopic(topic.id)}><span>{topic.label}</span><b>{game.asked.includes(topic.id) ? "確認済み" : "実行前に確認"}</b></button>)}</div></aside></div>}
    {pendingAction && <ActionConfirmDialog confirmation={pendingAction.confirmation} actionsLeft={game.actionsLeft} onCancel={() => setPendingAction(null)} onConfirm={confirmPendingAction} />}
    {confirmAdvance && <div className="confirm-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmAdvance(false); }}><section className="advance-confirm-dialog" role="dialog" aria-modal="true"><p>TURN CHECK</p><h2>Actionを残したまま次へ進みますか？</h2><div><strong>{game.actionsLeft}</strong><span>Actionsが未使用です</span></div><p>情報が十分だと判断した場合は進めます。未使用Actionは次のターンへ持ち越されません。</p><footer><button className="dialog-secondary" onClick={() => setConfirmAdvance(false)}>このターンに戻る</button><button className="primary" onClick={() => { setConfirmAdvance(false); advanceTurn(); }}>Actionを残して進む</button></footer></section></div>}
    {actionResult && <ActionResultModal result={actionResult} onClose={closeResult} />}
  </main>;
}
