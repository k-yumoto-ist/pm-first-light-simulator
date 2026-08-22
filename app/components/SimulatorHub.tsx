"use client";

import { useEffect, useState } from "react";
import PMSimulator from "./PMSimulator";
import AdvancedSimulator from "./AdvancedSimulator";
import { scenarios } from "@/src/data/scenarios";
import type { Difficulty, PmbokDomain } from "@/src/data/types";
import type { ScenarioMode } from "@/src/data/statefulScenarioTypes";

type View = "home" | "light" | "training" | "scenario" | "advanced";

const trainingDomains: Array<{ id: PmbokDomain; label: string; icon: string; available: boolean }> = [
  { id: "scope", label: "Scope", icon: "◎", available: true },
  { id: "schedule", label: "Schedule", icon: "◷", available: true },
  { id: "resources", label: "Resources", icon: "♟", available: true },
  { id: "stakeholders", label: "Stakeholders", icon: "◇", available: true },
  { id: "governance", label: "Governance", icon: "⌂", available: false },
  { id: "finance", label: "Finance", icon: "¥", available: false },
  { id: "risk", label: "Risk", icon: "△", available: false },
];

const difficulties: Array<{ id: Difficulty; label: string; description: string }> = [
  { id: "guided", label: "GUIDED", description: "見るべきポイントと影響の方向を確認しながら進めます。" },
  { id: "standard", label: "STANDARD", description: "状況と行動の意味を手がかりに、自分で判断します。" },
  { id: "challenge", label: "CHALLENGE", description: "限られた情報だけで、経験者向けの判断に挑みます。" },
];

export default function SimulatorHub() {
  const [view, setView] = useState<View>("home");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>();
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [entryMode, setEntryMode] = useState<ScenarioMode>("training");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

  if (view === "light") return <PMSimulator />;
  if (view === "advanced" && selectedScenarioId) {
    return <AdvancedSimulator scenarioId={selectedScenarioId} difficulty={difficulty} mode={entryMode} onExit={() => setView("home")} />;
  }

  if (view === "training" || view === "scenario") {
    const selectScenario = (id: string) => setSelectedScenarioId(id);
    return (
      <main className={`v2-setup-shell mode-${view}`}>
        <header className="v2-brandbar">
          <button className="v2-back" onClick={() => { setView("home"); setSelectedScenarioId(undefined); }}>← MODE SELECT</button>
          <div><strong>PROJECT: FIRST LIGHT</strong><span>PM SIMULATOR</span></div>
        </header>
        <section className="v2-setup">
          <p className="v2-kicker">{view === "training" ? "TRAINING MODE" : "PROJECT SCENARIO MODE"}</p>
          <h1>{view === "training" ? "どの観点を体験しますか？" : "どの案件に向き合いますか？"}</h1>
          <p className="v2-lead">入口が違っても、判断の結果は同じプロジェクトの因果関係として進みます。</p>

          {view === "training" ? (
            <div className="v2-domain-grid">
              {trainingDomains.map((domain) => {
                const scenario = scenarios.find((item) => item.primaryDomain === domain.id);
                const active = scenario?.id === selectedScenarioId;
                return (
                  <button key={domain.id} disabled={!domain.available} className={`v2-select-card ${active ? "selected" : ""}`} onClick={() => scenario && selectScenario(scenario.id)}>
                    <span className="v2-select-icon">{domain.icon}</span>
                    <strong>{domain.label}</strong>
                    <small>{domain.available ? scenario?.subtitle : "COMING SOON"}</small>
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
            <div><p className="v2-kicker">PLAY STYLE</p><h2>情報の見え方を選ぶ</h2></div>
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
            <button className="primary large" disabled={!selectedScenarioId} onClick={() => setView("advanced")}>シミュレーションを開始 <span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="v2-home-shell">
      <div className="v2-sun" aria-hidden="true" />
      <header className="v2-home-brand"><span>FL</span><div><strong>PROJECT: FIRST LIGHT</strong><small>PM SIMULATOR</small></div></header>
      <section className="v2-home-hero">
        <p className="v2-kicker">DECIDE. OBSERVE. LEARN.</p>
        <h1>PMとして考えることを、<br /><em>プロジェクトの結果</em>から学ぶ。</h1>
        <p>知識を先に覚えるのではなく、状況を読み、判断し、起きたことを振り返るシミュレーションです。</p>
      </section>
      <section className="v2-mode-grid" aria-label="プレイモード">
        <button className="v2-mode-card light" onClick={() => setView("light")}>
          <span className="v2-mode-number">01</span><p>LIGHT MODE</p><h2>初めての<br />プロジェクトマネジメント</h2><small>既存の4ターンを通じて、PMの基本を体験</small><b>PLAY →</b>
        </button>
        <button className="v2-mode-card" onClick={() => { setEntryMode("training"); setView("training"); }}>
          <span className="v2-mode-number">02</span><p>TRAINING MODE</p><h2>特定テーマを<br />集中的に練習する</h2><small>Scope / Schedule / Resources / Stakeholders</small><b>SELECT →</b>
        </button>
        <button className="v2-mode-card" onClick={() => { setEntryMode("project"); setView("scenario"); }}>
          <span className="v2-mode-number">03</span><p>PROJECT SCENARIO MODE</p><h2>複雑な案件で<br />PMとして悩む</h2><small>追加要件・遅延・離脱・関係者対立</small><b>SELECT →</b>
        </button>
      </section>
    </main>
  );
}
