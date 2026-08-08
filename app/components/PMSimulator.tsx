"use client";

import { useEffect, useMemo, useState } from "react";
import { characters } from "../data/characters";
import { conversationEngine } from "../lib/conversationEngine";
import { projectBrief, releaseChoices, requestChoices, turns } from "../data/scenario";
import { calculateScores } from "../data/scoring";
import { buildFeedback } from "../data/feedback";
import type { CharacterId, Effect, GameFlags, GameState, Metrics, ScoreKey } from "../types/game";

const initialFlags: GameFlags = {
  decisionMakerKnown: false, apiRiskKnown: false, apiRiskMitigated: false,
  juniorProgressChecked: false, additionalRequestAccepted: false,
  requestBackgroundKnown: false, impactAnalysisDone: false,
  stakeholderAligned: false, releaseCriteriaKnown: false, priorityAdjusted: false,
  delayRecovered: false, reportedStatus: false,
};
const initialMetrics: Metrics = { schedule: 78, quality: 76, trust: 70, team: 78, scopeStability: 58, riskExposure: 52, stakeholderAlignment: 42 };
function makeInitialState(): GameState { return { phase: "intro", turn: 1, actionsLeft: 3, metrics: initialMetrics, flags: initialFlags, chats: { sato: [], takahashi: [], tanaka: [], suzuki: [] }, logs: [], asked: [], turnNotice: "案件資料だけでは、判断に必要な情報が足りません。" }; }
const statusFor = (value: number) => value >= 78 ? "順調" : value >= 60 ? "注意" : value >= 42 ? "遅延" : "危険";
const riskStatus = (value: number) => value <= 30 ? "低" : value <= 58 ? "中" : "高";
const clamp = (value: number) => Math.max(0, Math.min(100, value));
function applyEffect(state: GameState, effect?: Effect): GameState {
  if (!effect) return state;
  const metrics = { ...state.metrics };
  Object.entries(effect.metrics || {}).forEach(([key, delta]) => { metrics[key as keyof Metrics] = clamp(metrics[key as keyof Metrics] + (delta || 0)); });
  return { ...state, metrics, flags: { ...state.flags, ...(effect.flags || {}) } };
}
const scoreLabels: Record<ScoreKey, string> = { scope: "Scope Management", schedule: "Schedule Management", stakeholder: "Stakeholder Management", risk: "Risk Management" };
function MetricCard({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const state = inverse ? riskStatus(value) : statusFor(value); const level = inverse ? 100 - value : value;
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><strong className={`status status-${state}`}>{state}</strong></div><div className="meter"><i style={{ width: `${level}%` }} /></div></div>;
}

export default function PMSimulator() {
  const [game, setGame] = useState<GameState>(makeInitialState);
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [previousScores, setPreviousScores] = useState<Record<ScoreKey, number> | null>(null);
  const [showLog, setShowLog] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem("pm-simulator-last-score"); if (raw) setPreviousScores(JSON.parse(raw)); } catch {} }, []);
  const scores = useMemo(() => calculateScores(game), [game]);
  const feedback = useMemo(() => buildFeedback(game), [game]);
  const currentCharacter = characters.find(c => c.id === selected);
  const currentTopics = selected ? conversationEngine.getTopics(selected, game) : [];
  const decisionPending = (game.turn === 2 && !game.requestDecision) || (game.turn === 4 && !game.releaseDecision);
  const explorationDisabled = game.actionsLeft === 0 || (decisionPending && game.actionsLeft === 1);

  const spendAction = (label: string, detail: string, effect: Effect | undefined, tags: ScoreKey[]) => {
    if (explorationDisabled) return;
    setGame(prev => { const changed = applyEffect(prev, effect); return { ...changed, actionsLeft: prev.actionsLeft - 1, logs: [...prev.logs, { id: crypto.randomUUID(), turn: prev.turn, label, detail, tags }] }; });
  };
  const askTopic = (topicId: string) => {
    if (!selected || game.asked.includes(topicId) || explorationDisabled) return;
    const topic = currentTopics.find(t => t.id === topicId); if (!topic) return;
    const reply = conversationEngine.getReply(topic, game);
    setGame(prev => { const changed = applyEffect(prev, topic.effect); const messages = [...prev.chats[selected], { id: crypto.randomUUID(), speaker: "player" as const, text: topic.playerText, turn: prev.turn }, { id: crypto.randomUUID(), speaker: selected, text: reply, turn: prev.turn }]; return { ...changed, actionsLeft: prev.actionsLeft - 1, asked: [...prev.asked, topic.id], chats: { ...prev.chats, [selected]: messages }, logs: [...prev.logs, { id: crypto.randomUUID(), turn: prev.turn, label: `${currentCharacter?.name}さんと会話`, detail: topic.label, tags: topic.tags }] }; });
  };
  const doOperation = (id: string) => {
    const operations: Record<string, { label: string; detail: string; effect: Effect; tags: ScoreKey[] }> = {
      schedule: { label: "スケジュールを確認", detail: "完了・残作業・依存関係を見直した", effect: { metrics: { schedule: 5 } }, tags: ["schedule"] },
      risk: { label: "リスクを整理", detail: game.flags.apiRiskKnown ? "外部APIの対応策と兆候を整理した" : "現時点で見えている不確実性を洗い出した", effect: game.flags.apiRiskKnown ? { flags: { apiRiskMitigated: true }, metrics: { riskExposure: -16, schedule: 4 } } : { metrics: { riskExposure: -5 } }, tags: ["risk"] },
      scope: { label: "要件を整理", detail: game.turn === 2 ? "追加要望の作業量・テスト・日程影響を分析した" : "確定事項と未確定事項を分けた", effect: game.turn === 2 ? { flags: { impactAnalysisDone: true }, metrics: { scopeStability: 14, schedule: 5 } } : { metrics: { scopeStability: 8 } }, tags: ["scope"] },
      team: { label: "チーム状況を確認", detail: "負荷・困りごと・予定との差を確認した", effect: { flags: { juniorProgressChecked: true }, metrics: { team: 7, schedule: 5 } }, tags: ["schedule"] },
      report: { label: "顧客に状況報告", detail: "現状、懸念、次に必要な判断を共有した", effect: { flags: { reportedStatus: true }, metrics: { trust: 6, stakeholderAlignment: game.flags.decisionMakerKnown ? 8 : 3 } }, tags: ["stakeholder"] },
    }; const op = operations[id]; spendAction(op.label, op.detail, op.effect, op.tags);
  };
  const chooseRequest = (id: string) => {
    if (game.requestDecision || game.actionsLeft <= 0) return; const choice = requestChoices.find(c => c.id === id)!;
    const effects: Record<string, Effect> = { accept: { flags: { additionalRequestAccepted: true }, metrics: { trust: 8, scopeStability: -20, schedule: -10, quality: -4 } }, analyze: { flags: { impactAnalysisDone: true }, metrics: { scopeStability: 12, trust: 3, schedule: 4 } }, later: { flags: { priorityAdjusted: true }, metrics: { scopeStability: 12, trust: -5, schedule: 6 } }, background: { flags: { requestBackgroundKnown: true }, metrics: { scopeStability: 8, trust: 4 } } };
    setGame(prev => { const changed = applyEffect(prev, effects[id]); return { ...changed, actionsLeft: prev.actionsLeft - 1, requestDecision: id, logs: [...prev.logs, { id: crypto.randomUUID(), turn: 2, label: "追加要望に回答", detail: choice.label, tags: ["scope", "schedule"] }] }; });
  };
  const chooseRelease = (id: string) => {
    if (game.releaseDecision || game.actionsLeft <= 0) return; const choice = releaseChoices.find(c => c.id === id)!; const aligned = game.flags.stakeholderAligned || game.flags.releaseCriteriaKnown;
    const effects: Record<string, Effect> = { trim: { flags: { priorityAdjusted: true }, metrics: { schedule: 14, quality: 5, trust: aligned ? 7 : -3, team: 5, scopeStability: 14 } }, delay: { metrics: { schedule: -18, quality: 17, trust: aligned ? 5 : -8, team: 10 } }, force: { metrics: { schedule: 8, quality: -18, trust: -8, team: -22, riskExposure: 15 } }, negotiate: { flags: { stakeholderAligned: true }, metrics: { schedule: 4, quality: 7, trust: aligned ? 12 : 5, team: 6, stakeholderAlignment: 14 } }, staged: { flags: { priorityAdjusted: true, stakeholderAligned: true }, metrics: { schedule: 10, quality: 12, trust: aligned ? 12 : 5, team: 7, riskExposure: -10 } } };
    setGame(prev => { const changed = applyEffect(prev, effects[id]); return { ...changed, actionsLeft: prev.actionsLeft - 1, releaseDecision: id, logs: [...prev.logs, { id: crypto.randomUUID(), turn: 4, label: "リリース方針を決定", detail: choice.label, tags: ["scope", "schedule", "stakeholder", "risk"] }] }; });
  };
  const advanceTurn = () => {
    if (game.turn === 2 && !game.requestDecision) return;
    if (game.turn === 4) { if (!game.releaseDecision) return; const finalScores = calculateScores(game); try { localStorage.setItem("pm-simulator-last-score", JSON.stringify(finalScores)); } catch {} setGame(prev => ({ ...prev, phase: "result" })); setSelected(null); return; }
    const nextTurn = game.turn + 1;
    setGame(prev => { let next: GameState = { ...prev, turn: nextTurn, actionsLeft: 3 };
      if (nextTurn === 2) next.turnNotice = "佐藤：『営業部から要望が出まして、この検索条件も追加できますか？ そこまで大きな変更ではないと思います。』";
      if (nextTurn === 3) { const juniorImpact = prev.flags.juniorProgressChecked ? -4 : -18; const apiImpact = prev.flags.apiRiskMitigated ? -2 : prev.flags.apiRiskKnown ? -9 : -20; next = applyEffect(next, { metrics: { schedule: juniorImpact + apiImpact, quality: prev.flags.apiRiskKnown ? -2 : -8, team: prev.flags.juniorProgressChecked ? -2 : -8, riskExposure: prev.flags.apiRiskMitigated ? 2 : 18 } }); next.turnNotice = `${prev.flags.juniorProgressChecked ? "鈴木の遅れは1日で検知。" : "鈴木のタスクが5日遅れていると判明。"} ${prev.flags.apiRiskMitigated ? "API変更は準備済みのモックで吸収できそうです。" : prev.flags.apiRiskKnown ? "懸念していたAPI仕様変更が発生。対応策の具体化が必要です。" : "さらに、未認識だったAPI仕様変更が直撃しました。"}`; }
      if (nextTurn === 4) { next = applyEffect(next, { metrics: { team: -9, quality: prev.metrics.schedule < 55 ? -7 : -2 } }); next.turnNotice = prev.flags.stakeholderAligned ? "高橋：『共有いただいた選択肢をもとに判断しましょう。』" : "高橋：『この状態で本当にリリースして問題ありませんか？ 私は詳しい話を聞いていません。』"; }
      return next; }); setSelected(null);
  };
  const restart = () => { setPreviousScores(scores); setGame(makeInitialState()); setSelected(null); };

  if (game.phase === "intro") return <main className="intro-shell"><div className="intro-glow" /><header className="brand"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span><small>PM SIMULATION</small></header><section className="hero"><p className="eyebrow">YOUR FIRST ASSIGNMENT</p><h1>あなたは今日から、<br /><em>このプロジェクトのPMです。</em></h1><p className="hero-copy">答えは資料の中に揃っていません。人に聞き、状況を読み、限られた時間で判断してください。</p><button className="primary large" onClick={() => setGame(prev => ({ ...prev, phase: "playing" }))}>案件を引き受ける <span>→</span></button><p className="play-time">全4ターン・想定プレイ時間 30〜45分</p></section><section className="brief-grid"><article className="brief-main"><span className="card-kicker">PROJECT BRIEF</span><h2>{projectBrief.title}</h2><p>{projectBrief.purpose}</p></article><article><span>RELEASE</span><strong>{projectBrief.release}</strong></article><article><span>TEAM</span><strong>{projectBrief.team}</strong></article><article><span>KNOWN SCOPE</span><strong>{projectBrief.requirements}</strong></article><article className="quote"><span>FROM CUSTOMER</span><strong>{projectBrief.customer}</strong></article><article className="risk"><span>KNOWN RISK</span><strong>{projectBrief.risk}</strong><small>情報は意図的に不完全です</small></article></section></main>;

  if (game.phase === "result") { const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4); const releaseSuccess = game.metrics.schedule >= 45 && game.metrics.quality >= 45; const ordered = (Object.keys(scores) as ScoreKey[]).sort((a, b) => scores[b] - scores[a]); const best = ordered[0], low = ordered[ordered.length - 1];
    return <main className="result-page"><header className="result-hero"><p className="eyebrow">PROJECT RESULT</p><h1>{releaseSuccess ? "プロジェクトは着地しました。" : "厳しい着地になりました。"}</h1><p>結果より大切なのは、どの判断がこの状況を作ったかです。</p></header><section className="result-summary"><div className="result-seal"><small>YOUR PM SCORE</small><strong>{avg}</strong><span>/ 100</span></div><div className="outcomes"><div><span>リリース</span><strong>{releaseSuccess ? "成功" : "課題を残して完了"}</strong></div><div><span>納期</span><strong>{statusFor(game.metrics.schedule)}</strong></div><div><span>品質</span><strong>{statusFor(game.metrics.quality)}</strong></div><div><span>顧客信頼</span><strong>{statusFor(game.metrics.trust)}</strong></div><div><span>チーム状態</span><strong>{statusFor(game.metrics.team)}</strong></div></div></section><section className="score-grid">{(Object.keys(scores) as ScoreKey[]).map(key => <article key={key}><div><span>{scoreLabels[key]}</span><strong>{scores[key]}</strong></div><div className="score-meter"><i style={{ width: `${scores[key]}%` }} /></div>{previousScores && <small className={scores[key] >= previousScores[key] ? "up" : "down"}>前回 {previousScores[key]} → 今回 {scores[key]}</small>}</article>)}</section><section className="style-card"><span className="card-kicker">YOUR PM STYLE</span><h2>強みは「{scoreLabels[best]}」</h2><p>今回もっとも発揮できたのは{scoreLabels[best]}です。一方、次の挑戦では{scoreLabels[low]}に関わる確認を、問題が見える前に一つ増やしてみてください。</p></section><section className="reflection"><div className="section-heading"><p className="eyebrow">FROM EXPERIENCE TO PMBOK</p><h2>あなたの行動を、PMBOKで言語化する</h2></div><div className="feedback-list">{feedback.map(item => <article key={item.area} className={item.positive ? "positive" : "lesson"}><div className="feedback-area">{scoreLabels[item.area]}</div><div><h3>{item.title}</h3><p>{item.story}</p><p className="pmbok"><b>PMBOKの観点</b>{item.lesson}</p></div></article>)}</div></section><section className="takeaways"><div><p className="eyebrow">THE BASICS</p><h2>今回学んだPMの基本</h2></div><ul><li>誰が意思決定者なのかを確認する</li><li>要望をそのまま受けず影響を見る</li><li>スケジュールは定期的に確認する</li><li>リスクは問題になる前に考える</li><li>プロジェクトは人との合意形成で進む</li></ul></section><section className="retry"><h2>このプロジェクトに、もう一度挑戦しますか？</h2><p>前回と違う人に、違う質問をすると、その先の状況が変わります。</p><button className="primary large" onClick={restart}>別の判断でリトライ <span>↻</span></button></section></main>;
  }

  const turn = turns[game.turn - 1]; const canAdvance = game.turn !== 2 || Boolean(game.requestDecision);
  return <main className="game-shell"><header className="topbar"><div className="brand compact"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span></div><div className="turn-progress"><span>{turn.week}</span><div>{turns.map((_, i) => <i key={i} className={i < game.turn ? "active" : ""} />)}</div></div><button className="log-button" onClick={() => setShowLog(!showLog)}>行動ログ <b>{game.logs.length}</b></button></header><section className="workspace"><aside className="status-panel"><div className="panel-title"><span>PROJECT STATUS</span><small>数値ではなく兆候を見る</small></div><MetricCard label="Schedule" value={game.metrics.schedule} /><MetricCard label="Quality" value={game.metrics.quality} /><MetricCard label="Customer Trust" value={game.metrics.trust} /><MetricCard label="Team Condition" value={game.metrics.team} /><div className="risk-line"><span>Risk Exposure</span><strong>{riskStatus(game.metrics.riskExposure)}</strong></div><div className="known-facts"><span>判明した重要情報</span><ul><li className={game.flags.decisionMakerKnown ? "known" : ""}>{game.flags.decisionMakerKnown ? "決裁者：高橋部長" : "最終決裁者：未確認"}</li><li className={game.flags.apiRiskKnown ? "known" : ""}>{game.flags.apiRiskKnown ? "外部API：仕様遅延の恐れ" : "技術リスク：未確認"}</li><li className={game.flags.releaseCriteriaKnown ? "known" : ""}>{game.flags.releaseCriteriaKnown ? "成功条件：確認済み" : "リリース成功条件：未確認"}</li></ul></div></aside><section className="main-stage"><div className="turn-heading"><div><p className="eyebrow">TURN {game.turn} · {turn.theme}</p><h1>{turn.title}</h1><p>{turn.description}</p></div><div className="action-counter"><strong>{game.actionsLeft}</strong><span>ACTIONS<br />LEFT</span></div></div><div className={`event-card event-turn-${game.turn}`}><span className="event-tag">LIVE UPDATE</span><p>{game.turnNotice}</p></div>{game.turn === 2 && <section className="decision-block"><div className="decision-title"><span>あなたの返答</span><small>1 Action</small></div><div className="choice-grid">{requestChoices.map(choice => <button key={choice.id} disabled={Boolean(game.requestDecision) || game.actionsLeft === 0} className={game.requestDecision === choice.id ? "selected" : ""} onClick={() => chooseRequest(choice.id)}><strong>{choice.label}</strong><span>{choice.note}</span></button>)}</div></section>}{game.turn === 4 && <section className="decision-block release"><div className="decision-title"><span>リリース方針を決める</span><small>正解は一つではありません</small></div><div className="choice-grid">{releaseChoices.map(choice => <button key={choice.id} disabled={Boolean(game.releaseDecision) || game.actionsLeft === 0} className={game.releaseDecision === choice.id ? "selected" : ""} onClick={() => chooseRelease(choice.id)}><strong>{choice.label}</strong><span>{choice.note}</span></button>)}</div></section>}<section className="operations"><div className="decision-title"><span>PMアクション</span><small>{decisionPending && game.actionsLeft === 1 ? "最後の1Actionは判断用" : "各 1 Action"}</small></div><div className="operation-row">{[{id:"schedule",icon:"◷",label:"スケジュール"},{id:"risk",icon:"△",label:"リスク整理"},{id:"scope",icon:"◇",label:"要件整理"},{id:"team",icon:"◎",label:"チーム確認"},{id:"report",icon:"↗",label:"顧客報告"}].map(op => <button key={op.id} disabled={explorationDisabled} onClick={() => doOperation(op.id)}><b>{op.icon}</b><span>{op.label}</span></button>)}</div></section><div className="turn-footer"><p>{decisionPending && game.actionsLeft === 1 ? "最後の1Actionで、このターンの判断をしてください。" : game.actionsLeft === 0 ? "このターンのアクションを使い切りました。" : `あと${game.actionsLeft}回、会話または確認ができます。`}</p><button className="primary" disabled={!canAdvance || (game.turn === 4 && !game.releaseDecision)} onClick={advanceTurn}>{game.turn === 4 ? "プロジェクト結果を見る" : "次のターンへ"} <span>→</span></button></div></section><aside className="people-panel"><div className="panel-title"><span>PEOPLE</span><small>誰に、何を聞く？</small></div>{characters.map(person => <button key={person.id} className={`person ${selected === person.id ? "active" : ""}`} onClick={() => setSelected(person.id)}><span className={`avatar ${person.color}`}>{person.initials}</span><span><strong>{person.name}</strong><small>{person.role}</small><em>{person.status}</em></span><b>→</b></button>)}</aside></section>
    {selected && currentCharacter && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="chat-drawer" onClick={e => e.stopPropagation()}><header><span className={`avatar ${currentCharacter.color}`}>{currentCharacter.initials}</span><div><strong>{currentCharacter.name}</strong><small>{currentCharacter.role}</small></div><button aria-label="会話を閉じる" onClick={() => setSelected(null)}>×</button></header><div className="chat-history">{game.chats[selected].length === 0 && <div className="chat-intro"><span className={`avatar ${currentCharacter.color}`}>{currentCharacter.initials}</span><p>{currentCharacter.name}さんに、何を確認しますか？<br />質問の具体性で得られる情報が変わります。</p></div>}{game.chats[selected].map(message => <div key={message.id} className={`bubble ${message.speaker === "player" ? "mine" : "theirs"}`}><small>{message.speaker === "player" ? "あなた" : currentCharacter.name}</small><p>{message.text}</p></div>)}</div><div className="topic-list"><div><strong>何について聞きますか？</strong><small>{decisionPending && game.actionsLeft === 1 ? "判断用Actionを確保中" : `残り ${game.actionsLeft} Action`}</small></div>{currentTopics.map(topic => <button key={topic.id} disabled={game.asked.includes(topic.id) || explorationDisabled} onClick={() => askTopic(topic.id)}><span>{topic.label}</span><b>{game.asked.includes(topic.id) ? "確認済み" : "+1"}</b></button>)}</div></aside></div>}
    {showLog && <div className="log-popover"><header><strong>ACTION LOG</strong><button onClick={() => setShowLog(false)}>×</button></header>{game.logs.length === 0 ? <p>まだ行動はありません。</p> : [...game.logs].reverse().map(log => <article key={log.id}><b>TURN {log.turn}</b><strong>{log.label}</strong><span>{log.detail}</span></article>)}</div>}
  </main>;
}
