import type { StatefulScenarioDefinition, ScenarioAction, ScenarioDecision, StatefulScenarioTurn } from "../statefulScenarioTypes";
import { statefulActionCategories } from "../scenarios/stateful-action-categories";

const info = [
  { id: "budget_baseline", label: "予算の基準", detail: "残予算と承認済みの費目を確認した。", source: "予算資料" },
  { id: "actual_cost", label: "実績コスト", detail: "外注費が計画より増えている。", source: "コスト実績" },
  { id: "value_driver", label: "価値の源泉", detail: "継続率向上に直結する機能が価値の中心。", source: "顧客ヒアリング" },
  { id: "forecast", label: "着地見込み", detail: "現状のままでは予算を8%超過する見込み。", source: "コスト予測" },
  { id: "cost_options", label: "調整案", detail: "優先機能を守り、低価値の作業を次期へ送る案がある。", source: "スコープ整理" },
  { id: "approval_owner", label: "承認者", detail: "追加予算の承認は事業責任者が行う。", source: "ガバナンス確認" },
  { id: "vendor_flex", label: "ベンダー調整余地", detail: "納品単位を分ければ支払時期を調整できる。", source: "ベンダー確認" },
  { id: "budget_risk", label: "予算リスク", detail: "追加発注を先に約束すると、削減余地が失われる。", source: "リスク整理" },
] as const;

const hearingTargets: Record<string, string> = { fin_ask_customer: "mori", fin_ask_dev: "tanaka", fin_ask_owner: "takahashi" };
const lowValueActionIds = new Set(["fin_report_plan"]);
const factDependentActionIds = new Set(["fin_schedule"]);

const action = (id: string, title: string, category: ScenarioAction["category"], description: string, grantsInformation: string[], extra: Partial<ScenarioAction> = {}): ScenarioAction => ({
  id, title, category, description, availableFromTurn: 1, grantsInformation: lowValueActionIds.has(id) || factDependentActionIds.has(id) ? [] : grantsInformation, repeatPolicy: "per-turn", stakeholderId: category === "hearing" ? hearingTargets[id] : undefined, question: category === "hearing" ? description : undefined,
  result: lowValueActionIds.has(id) ? "比較案が固まる前の共有だったため、具体的な判断材料は増えませんでした。" : `${title}を実施し、次の判断材料を整理しました。`, whyThisResult: lowValueActionIds.has(id) ? "共有だけでは予実差や価値の優先順位を把握できないためです。" : "事実を確認してからコストと価値を比較するためです。", ...extra,
});

const decisions = (turn: number): ScenarioDecision[] => {
  if (turn === 1) return [
    { id: "finance_measure", title: "実績と予算の差を確認する", description: "まず計画と実績を比較します。", metricEffects: { riskExposure: -2 }, evidence: [{ areaId: "finance", elementId: "control", behavior: "impact_analysis", weight: 2 }], whatHappened: "予算差異を把握しました。", why: "憶測ではなく実績から状況を見たためです。", pmPoint: "財務判断は計画と実績の差分から始めます。", chainEffect: "差異を把握" },
    { id: "promise_extra", title: "追加発注を先に約束する", description: "納期を守るため、まず発注を確定します。", irreversible: true, metricEffects: { schedule: 2, budget: -8, riskExposure: 5 }, setsFlags: { extraPromised: true }, evidence: [], whatHappened: "追加発注を先に約束しました。", why: "影響と承認条件を確認する前にコミットしたためです。", pmPoint: "先に約束すると、後の選択肢が狭まります。", chainEffect: "予算の調整余地が縮小" },
    { id: "cut_blindly", title: "一律に費用を削る", description: "全項目を同じ割合で削減します。", metricEffects: { quality: -4, businessValue: -4, budget: 3 }, setsFlags: { blindCut: true }, evidence: [], whatHappened: "費用は下がりましたが価値の高い作業も削りました。", why: "価値とコストを分けずに削減したためです。", pmPoint: "削減は金額だけでなく価値への影響で比較します。", chainEffect: "価値の低下を伴う削減" },
  ];
  if (turn === 2) return [
    { id: "make_forecast", title: "着地見込みと選択肢を作る", description: "実績と価値をもとに複数案を比較します。", requiresInformation: ["actual_cost", "value_driver"], hidesWhenMissing: true, metricEffects: { riskExposure: -3, stakeholderAlignment: 3 }, setsFlags: { forecastReady: true }, evidence: [{ areaId: "finance", elementId: "forecast", behavior: "impact_analysis", weight: 2 }, { areaId: "finance", elementId: "options", behavior: "alternative_proposal", weight: 2 }], whatHappened: "価値を守る費用調整案を比較できました。", why: "実績と価値の情報をそろえたためです。", pmPoint: "予算は削るだけでなく、価値の高い投資へ再配分します。", chainEffect: "選択肢を比較" },
    { id: "freeze_all", title: "すべての追加作業を止める", description: "予算超過を避けるため一律に停止します。", metricEffects: { schedule: -3, businessValue: -5, budget: 4 }, setsFlags: { freezeAll: true }, evidence: [], whatHappened: "超過は抑えましたが価値の高い作業も止まりました。", why: "優先順位を整理せず停止したためです。", pmPoint: "停止の判断にも守る価値と期限を示します。", chainEffect: "短期節約と価値の喪失" },
    { id: "ask_sales_cost", title: "営業へ技術コストの原因を聞く", description: "営業から実装費の詳細を確認します。", metricEffects: { trust: -1 }, evidence: [], whatHappened: "営業は顧客価値は説明できましたが、実装コストの内訳は把握していませんでした。", why: "費用の事実は開発・経理に近い情報源へ確認する必要があるためです。", pmPoint: "誰から何が分かるかを見極めます。", chainEffect: "情報源の選択ミス" },
  ];
  return [
    { id: "approve_plan", title: "承認者へ調整案を提示する", description: "守る価値と必要予算を記録して承認を得ます。", requiresInformation: ["forecast", "approval_owner", "cost_options"], hidesWhenMissing: true, irreversible: true, metricEffects: { budget: 3, trust: 4, stakeholderAlignment: 5, riskExposure: -4 }, setsFlags: { finalAgreement: true }, evidence: [{ areaId: "finance", elementId: "options", behavior: "alternative_proposal", weight: 2 }, { areaId: "finance", elementId: "approval", behavior: "written_agreement", weight: 1 }], whatHappened: "価値と予算の調整案を承認者へ提示しました。", why: "着地見込みと優先順位を共有したためです。", pmPoint: "追加予算の相談には、目的・影響・代替案を添えます。", chainEffect: "予算と価値の合意" },
    { id: "accept_overrun", title: "超過を受け入れて全範囲を進める", description: "価値を守るため追加費用をそのまま承認します。", irreversible: true, metricEffects: { budget: -10, businessValue: 3, trust: 1, riskExposure: 4 }, setsFlags: { overrunAccepted: true }, evidence: [], whatHappened: "全範囲を守る代わりに予算超過を受け入れました。", why: "代替案と承認条件を十分に比較しなかったためです。", pmPoint: "超過を選ぶなら、得る価値と上限を明示します。", chainEffect: "価値と引き換えに超過" },
    { id: "hide_cost", title: "予算差異を次回報告へ回す", description: "対応を急ぐため、差異の報告を後回しにします。", metricEffects: { trust: -6, riskExposure: 6 }, setsFlags: { delayedReport: true }, evidence: [], whatHappened: "差異の共有を遅らせ、後で説明コストが増えました。", why: "悪い情報ほど早く共有する原則に反したためです。", pmPoint: "早期報告は問題を増やすのではなく、選択肢を残します。", chainEffect: "遅い報告が信頼を損なう" },
  ];
};

const turns: StatefulScenarioTurn[] = [
  { id: "signal", timing: "第1週 / 全3週", title: "予算差異の兆候", situation: "外注費が増え、追加作業の相談も届きました。計画と実績の差がまだ曖昧です。", thinkingPoint: "何が事実で、何を先に確認すべきでしょうか。", visibleInformation: ["外注費が増えている", "追加作業の相談がある"], newlyRelevantActionIds: ["fin_cost_actual", "fin_ask_customer"], decisions: decisions(1) },
  { id: "forecast", timing: "第2週 / 全3週", title: "着地を見通す", situation: "実績を積み上げると、このままでは予算超過が見込まれます。守る価値と削れる範囲を考えます。", thinkingPoint: "費用だけでなく、何の価値を守るかを比較しましょう。", visibleInformation: ["予算超過の見込み", "価値の高い機能がある"], newlyRelevantActionIds: ["fin_forecast", "fin_scope_options"], delayedEffects: [{ requiresAll: ["extraPromised"], metricEffects: { budget: -5, riskExposure: 4 }, text: "先に発注を約束したため、調整余地が減りました。", chainEffect: "早い約束が予算を固定" }], decisions: decisions(2) },
  { id: "approval", timing: "第3週 / 全3週", title: "予算の着地点を決める", situation: "承認者へ報告し、守る価値と費用の上限を決める時です。", thinkingPoint: "誰が、どの根拠で、どの上限を承認するかを残します。", visibleInformation: ["承認者への説明が必要", "複数の対応案がある"], newlyRelevantActionIds: ["fin_ask_owner", "fin_report_plan"], decisions: decisions(3) },
];

export const financeTraining: StatefulScenarioDefinition = {
  id: "finance-training", title: "限られた予算をどう使うか", description: "実績・価値・承認をつなぎ、予算を守りながら成果を作る3ターンの練習です。", mode: "training", supportedDifficulties: ["guided", "standard", "challenge"], primaryDomain: "finance", relatedDomains: ["scope", "governance", "stakeholders"],
  initialMetrics: { schedule: 70, budget: 58, quality: 74, trust: 66, teamHealth: 70, businessValue: 68, riskExposure: 46, scopeStability: 72, stakeholderAlignment: 60 }, initialFlags: { extraPromised: false, forecastReady: false, finalAgreement: false },
  intro: { emphasizedHeadline: "限られた予算で価値を守るPMです。", description: "外注費の増加と追加要望が重なりました。事実を集め、価値・コスト・承認をつないでください。", briefTitle: "顧客ポータル改善", phase: "予算見直し", team: "PM・開発・営業・経理・顧客", issueLabel: "現在の課題", issue: "外注費の増加", requestLabel: "顧客からの要望", request: "重要機能を予定内に届けたい", risk: "予算超過と価値の低下" },
  stakeholders: [{ id: "tanaka", name: "田中", role: "開発リーダー", priority: "実装費と品質を守りたい", avatar: "田" }, { id: "mori", name: "森", role: "営業責任者", priority: "顧客価値を守りたい", avatar: "森" }, { id: "kobayashi", name: "小林", role: "経理責任者", priority: "承認可能な上限を管理したい", avatar: "小" }, { id: "takahashi", name: "高橋", role: "事業責任者", priority: "価値と投資を判断したい", avatar: "高" }], information: [...info], actions: [
    action("fin_cost_actual", "実績コストを確認する", "schedule", "費目別の実績と計画差異を見る。", ["actual_cost", "budget_baseline"]), action("fin_ask_customer", "顧客の価値を聞く", "hearing", "追加要望が生む価値を確認する。", ["value_driver"]), action("fin_ask_dev", "開発へ費用の原因を聞く", "hearing", "実装費の増加要因を確認する。", ["actual_cost"]), action("fin_schedule", "支出予定を点検する", "schedule", "今後の支払い時期を確認する。", ["forecast"]), action("fin_risk", "予算リスクを整理する", "risk", "超過の発生条件を整理する。", ["budget_risk"]), action("fin_scope_options", "費用と範囲の案を整理する", "scope", "価値を守る調整案を比較する。", [], { conditionalOutcomes: [{ requiresInformation: ["actual_cost", "value_driver"], grantsInformation: ["cost_options"], result: "価値の高い機能を残し、低価値の作業を次期へ送る案を作れました。", whyThisResult: "実績と価値をそろえたためです." }] }), action("fin_team", "チームの追加負荷を確認する", "team", "追加費用と稼働の関係を見る。", ["budget_risk"]), action("fin_report", "経理へ差異を共有する", "report", "予実差異を報告する。", ["approval_owner"]), action("fin_forecast", "着地見込みを作る", "scope", "予算の着地を分析する。", [], { conditionalOutcomes: [{ requiresInformation: ["actual_cost", "budget_baseline"], grantsInformation: ["forecast"], result: "現状のままなら8%超過する着地見込みを作れました。", whyThisResult: "計画と実績を比較したためです." }] }), action("fin_ask_owner", "承認者を確認する", "hearing", "追加予算の判断者を確認する。", ["approval_owner"]), action("fin_risk_option", "超過対応のリスクを整理する", "risk", "発注を先に約束した場合の影響を見る。", ["budget_risk"]), action("fin_report_plan", "調整案を関係者へ共有する", "report", "予算と価値の比較案を共有する。", ["vendor_flex"]),
  ], actionCategories: statefulActionCategories, turns, reactionRules: [{ stakeholderId: "kobayashi", requiresAll: ["finalAgreement"], text: "上限と根拠が記録されているので承認しやすいです。" }, { stakeholderId: "mori", text: "守る価値を明確に説明できると顧客とも話しやすくなります。", fallback: true }], resultConfig: { scoredInformation: [{ id: "budget_baseline", weight: 2 }, { id: "actual_cost", weight: 2 }, { id: "value_driver", weight: 2 }, { id: "forecast", weight: 2 }, { id: "cost_options", weight: 2 }, { id: "approval_owner", weight: 1 }], informationFullCreditRatio: 0.8, scoreMetrics: [{ key: "budget", weight: 2 }, { key: "businessValue", weight: 2 }, { key: "riskExposure", weight: 1.5 }, { key: "trust", weight: 1 }, { key: "quality", weight: 1 }], finalMetricKeys: ["budget", "businessValue", "trust", "teamHealth", "riskExposure"], outcomeSummary: [{ label: "予算", metric: "budget" }, { label: "事業価値", metric: "businessValue" }, { label: "顧客信頼", metric: "trust" }, { label: "リスク", metric: "riskExposure" }] },
};

financeTraining.investigationBudget = { guided: 3, standard: 2, challenge: 2 };
financeTraining.resultConfig.scoreWeights = { outcome: 0.3, decision: 0.4, information: 0.3 };
financeTraining.resultConfig.showPmStyle = false;
financeTraining.resultConfig.learningActions = ["実績と計画の差異を確認する", "価値を基準に調整案を比較する", "承認者へ根拠と上限を共有する"];
