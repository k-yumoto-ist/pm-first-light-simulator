"use client";

import { useEffect, useState } from "react";
import PMSimulator from "./PMSimulator";
import AdvancedSimulator from "./AdvancedSimulator";
import { scenarios } from "@/src/data/scenarios";
import type { Difficulty } from "@/src/data/types";
import type { ScenarioMode } from "@/src/data/statefulScenarioTypes";
import { getStatefulTrainingScenario, trainingScenarioCards } from "@/src/data/training/training-scenarios";
import { getStatefulProjectScenario } from "@/src/data/scenarios/stateful-project-scenarios";
import { modeThemes, modeThemeStyle } from "../data/modeThemes";
import { difficultyLabels } from "../data/uiLabels";
import { deleteSave, formatSavedAt, loadGames, type SavedPlaySession } from "../lib/playSession";
import { AccessibleDialog } from "./AccessibleDialog";

type View = "home" | "light" | "training" | "scenario" | "advanced";

const difficulties: Array<{ id: Difficulty; label: string; description: string }> = [
  { id: "guided", label: difficultyLabels.guided, description: "見るべきポイントと影響の方向を確認しながら進めます。" },
  { id: "standard", label: difficultyLabels.standard, description: "状況と行動の意味を手がかりに、自分で判断します。" },
  { id: "challenge", label: difficultyLabels.challenge, description: "限られた情報だけで、経験者向けの判断に挑みます。" },
];

function getSavedScenarioLabel(savedPlay: SavedPlaySession) {
  if (savedPlay.scenarioName) return savedPlay.scenarioName;
  if (!savedPlay.scenarioId) return undefined;
  if (savedPlay.mode === "training") return trainingScenarioCards.find(item => item.id === savedPlay.scenarioId)?.label;
  if (savedPlay.mode === "project") {
    return scenarios.find(item => item.id === savedPlay.scenarioId)?.title
      ?? getStatefulProjectScenario(savedPlay.scenarioId)?.title;
  }
  return undefined;
}

export default function SimulatorHub() {
  const [view, setView] = useState<View>("home");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>();
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [entryMode, setEntryMode] = useState<ScenarioMode>("training");
  const [savedGames, setSavedGames] = useState<SavedPlaySession[]>([]);
  const [resumeSession, setResumeSession] = useState<SavedPlaySession>();
  const [confirmDeleteSave, setConfirmDeleteSave] = useState<SavedPlaySession>();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSavedGames(loadGames()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const rememberExit = (saved: boolean, destination: View = "home") => {
    setSavedGames(loadGames());
    setResumeSession(undefined);
    setView(destination);
  };

  const resumePlay = (savedPlay: SavedPlaySession) => {
    if (savedPlay.mode === "light") { setResumeSession(savedPlay); setView("light"); return; }
    const scenarioExists = savedPlay.scenarioId && (savedPlay.mode === "training" ? getStatefulTrainingScenario(savedPlay.scenarioId) : getStatefulProjectScenario(savedPlay.scenarioId));
    if (!scenarioExists) {
      deleteSave(savedPlay.id);
      setSavedGames(loadGames());
      return;
    }
    setResumeSession(savedPlay);
    setEntryMode(savedPlay.mode);
    setSelectedScenarioId(savedPlay.scenarioId);
    setDifficulty(savedPlay.difficulty ?? "standard");
    setView("advanced");
  };

  if (view === "light") return <div className={`mode-simulator ${modeThemes.light.className}`} style={modeThemeStyle("light")}><PMSimulator resumeSession={resumeSession} onExit={(saved) => rememberExit(saved)} /></div>;
  if (view === "advanced" && selectedScenarioId) {
    return <AdvancedSimulator scenarioId={selectedScenarioId} difficulty={difficulty} mode={entryMode} resumeSession={resumeSession} onExit={(saved) => rememberExit(saved, entryMode === "training" ? "training" : "scenario")} onExitToHome={(saved) => rememberExit(saved)} />;
  }

  if (view === "training" || view === "scenario") {
    const selectScenario = (id: string) => setSelectedScenarioId(id);
    return (
      <main className={`v2-setup-shell ${view === "training" ? modeThemes.training.className : modeThemes.project.className}`} style={modeThemeStyle(view === "training" ? "training" : "project")}>
        <header className="v2-brandbar">
          <button className="v2-back" onClick={() => { setView("home"); setSelectedScenarioId(undefined); }}>← モード選択へ戻る</button>
          <div><strong>PROJECT: FIRST LIGHT</strong><span>PMシミュレーター</span></div>
        </header>
        <section className="v2-setup">
          <p className="v2-kicker">{view === "training" ? modeThemes.training.label : modeThemes.project.label}</p>
          <h1>{view === "training" ? "どの観点を体験しますか？" : "どの案件に向き合いますか？"}</h1>
          <p className="v2-lead">入口が違っても、判断の結果は同じプロジェクトの因果関係として進みます。</p>

          {view === "training" ? (
            <div className="v2-domain-grid">
              {trainingScenarioCards.map((domain) => {
                const active = domain.id === selectedScenarioId;
                return (
                  <button key={domain.id} className={`v2-select-card ${active ? "selected" : ""}`} onClick={() => selectScenario(domain.id)}>
                    <span className="v2-select-icon">{domain.icon}</span>
                    <strong>{domain.label}</strong>
                    <small>{domain.description}</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="v2-scenario-grid">
              {scenarios.map((scenario) => (
                <button key={scenario.id} className={`v2-select-card ${scenario.id === selectedScenarioId ? "selected" : ""}`} onClick={() => selectScenario(scenario.id)}>
                  <span className="v2-select-icon">{scenario.primaryDomain.slice(0, 1).toUpperCase()}</span>
                  <strong>{scenario.title}</strong>
                  <small>{scenario.subtitle}</small>
                </button>
              ))}
            </div>
          )}

          <div className="v2-difficulty">
            <div><p className="v2-kicker">プレイ難易度</p><h2>情報の見え方を選ぶ</h2></div>
            <div className="v2-difficulty-options">
              {difficulties.map((item) => (
                <button key={item.id} className={difficulty === item.id ? "selected" : ""} onClick={() => setDifficulty(item.id)}>
                  <strong>{item.label}</strong><span>{item.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="v2-setup-cta">
            <p>{selectedScenarioId ? "準備ができました。状況を読み、最初の判断を始めましょう。" : "体験するテーマを選んでください。"}</p>
            <button className="primary large" disabled={!selectedScenarioId} onClick={() => { setResumeSession(undefined); setView("advanced"); }}>シミュレーションを開始 <span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="v2-home-shell">
      <div className="v2-sun" aria-hidden="true" />
      <header className="v2-home-brand"><span>FL</span><div><strong>PROJECT: FIRST LIGHT</strong><small>PMシミュレーター</small></div></header>
      <section className="v2-home-hero">
        <p className="v2-kicker">状況を見る・判断する・学ぶ</p>
        <h1>PMとして考えることを、<br /><em>プロジェクトの結果</em>から学ぶ。</h1>
        <p>知識を先に覚えるのではなく、状況を読み、判断し、起きたことを振り返るシミュレーションです。</p>
      </section>
      {savedGames.length > 0 ? <section className="v2-saved-games" aria-label="保存したプレイ一覧">
        <div className="v2-saved-games-heading"><p className="v2-kicker">続きからプレイ</p><h2>保存したプレイ</h2><span>{savedGames.length}件</span></div>
        <div className="v2-saved-games-grid">{savedGames.map(savedPlay => <article className="v2-resume-card" key={savedPlay.id}>
          <div><span className="mode-badge">{modeThemes[savedPlay.mode].label}</span><strong>{getSavedScenarioLabel(savedPlay) ?? "最初の担当案件"}</strong><span>難易度：{difficultyLabels[savedPlay.difficulty ?? "standard"]}</span><span>進捗 {savedPlay.progress.current} / {savedPlay.progress.total}</span><small>{formatSavedAt(savedPlay.updatedAt)} 保存</small></div>
          <div><button className="primary" onClick={() => resumePlay(savedPlay)}>再開する</button><button className="v2-text-button" onClick={() => setConfirmDeleteSave(savedPlay)}>削除</button></div>
        </article>)}</div>
      </section> : null}
      {confirmDeleteSave ? <AccessibleDialog onClose={() => setConfirmDeleteSave(undefined)} labelledBy="delete-save-title" overlayClassName="confirm-overlay" dialogClassName="advance-confirm-dialog">
        <p>保存データ</p>
        <h2 id="delete-save-title">この保存データを削除しますか？</h2>
        <p>「{getSavedScenarioLabel(confirmDeleteSave) ?? "最初の担当案件"}」を削除します。他の保存データには影響しません。</p>
        <footer><button type="button" className="dialog-secondary" onClick={() => setConfirmDeleteSave(undefined)}>キャンセル</button><button type="button" className="play-delete-button" onClick={() => { deleteSave(confirmDeleteSave.id); setSavedGames(loadGames()); setConfirmDeleteSave(undefined); }}>削除する</button></footer>
      </AccessibleDialog> : null}
      <section className="v2-mode-grid" aria-label="プレイモード">
        <button className={`v2-mode-card light ${modeThemes.light.className}`} style={modeThemeStyle("light")} onClick={() => setView("light")}>
          <span className="v2-mode-number">01</span><p>{modeThemes.light.label}</p><h2>初めての<br />プロジェクトマネジメント</h2><small>既存の4ターンを通じて、PMの基本を体験</small><b>プレイする →</b>
        </button>
        <button className={`v2-mode-card ${modeThemes.training.className}`} style={modeThemeStyle("training")} onClick={() => { setEntryMode("training"); setView("training"); }}>
          <span className="v2-mode-number">02</span><p>{modeThemes.training.label}</p><h2>特定テーマを<br />集中的に練習する</h2><small>PMBOK 7領域の考え方を3ターンで練習</small><b>選ぶ →</b>
        </button>
        <button className={`v2-mode-card ${modeThemes.project.className}`} style={modeThemeStyle("project")} onClick={() => { setEntryMode("project"); setView("scenario"); }}>
          <span className="v2-mode-number">03</span><p>{modeThemes.project.label}</p><h2>複雑な案件で<br />PMとして悩む</h2><small>追加要件・遅延・離脱・関係者対立</small><b>選ぶ →</b>
        </button>
      </section>
    </main>
  );
}
