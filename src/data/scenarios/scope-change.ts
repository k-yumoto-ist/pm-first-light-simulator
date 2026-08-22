import type { HiddenState, ScenarioDefinition } from "../types";

const baseHidden: HiddenState = {
  scopeCreep: 0,
  burnoutRisk: 0,
  keyPersonDependency: 1,
  customerExpectationGap: 0,
  decisionOwnerDefined: true,
  contingencyPrepared: false,
  technicalDebt: 0,
  knowledgeConcentration: 1,
  agreementRecorded: false,
};

export const scopeChangeScenario: ScenarioDefinition = {
  id: "scope-change",
  title: "リリース直前の追加要件",
  subtitle: "追加要望を、価値と影響を見ながら扱う",
  trainingTitle: "Scope：追加要件をどう扱うか",
  scenarioTitle: "リリース直前の追加要件",
  primaryDomain: "scope",
  relatedDomains: ["schedule", "stakeholders", "finance"],
  briefing: {
    context: "リリース2週間前、顧客から新しい検索条件を追加したいという相談が届きました。",
    objective: "顧客が本当に達成したいことを捉え、納期と価値のバランスを取ります。",
    initialUnknowns: ["追加要件が必要な背景", "既存機能への影響", "今回のリリースでの優先順位"],
  },
  initialState: { schedule: 70, budget: 72, quality: 76, trust: 66, teamHealth: 70, businessValue: 72, riskExposure: 38 },
  initialHiddenState: baseHidden,
  observedBehaviorTags: ["purpose_confirmation", "impact_analysis", "alternative_proposal", "business_value_check", "scope_baseline_reference", "consensus_building", "written_agreement"],
  opportunityBehaviorTags: ["early_escalation", "stakeholder_analysis"],
  events: [
    {
      id: "request",
      title: "追加要望が届く",
      situation: "営業から「この検索条件も入れられませんか。大きな変更ではないと思います」と相談がありました。",
      decisionPrompt: "最初に、何を確認しますか？",
      choices: [
        { id: "accept", title: "すぐに追加を約束する", description: "顧客の期待に応えることを優先し、作業を始めます。", effects: { trust: 5, schedule: -8, quality: -4 }, hiddenEffects: { scopeCreep: 2, customerExpectationGap: 1 }, behaviorEvidence: [], feedback: { whatHappened: "追加要件は受け入れられましたが、影響を確認する時間がなくなりました。", why: "背景や影響を確認しないまま約束すると、作業量だけが先に膨らみます。", pmPoint: "要望を受けたときは、目的と影響を確認してから合意を作ります。" } },
        { id: "purpose", title: "必要な背景と目的を聞く", description: "要望の背景にある業務上の目的と、達成したい価値を確認します。", effects: { trust: 2, businessValue: 3 }, hiddenEffects: {}, behaviorEvidence: [{ areaId: "scope-control", elementId: "purpose", behavior: "purpose_confirmation", weight: 2 }, { areaId: "business-value", elementId: "value", behavior: "business_value_check", weight: 1 }], feedback: { whatHappened: "営業が困っている場面と、検索条件が必要になった背景が分かりました。", why: "機能名ではなく目的を聞いたことで、別の解決策も比較できる状態になりました。", pmPoint: "追加要件は、その機能が必要な理由を起点に考えると優先順位をつけやすくなります。" } },
        { id: "baseline", title: "現在の合意範囲を確認する", description: "いま約束している範囲とリリース条件を確認し、変更として扱う準備をします。", effects: { trust: 1, riskExposure: -3 }, hiddenEffects: {}, behaviorEvidence: [{ areaId: "scope-control", elementId: "baseline", behavior: "scope_baseline_reference", weight: 2 }, { areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 1 }], feedback: { whatHappened: "当初の合意範囲と今回の相談の差分が見えるようになりました。", why: "基準をそろえたことで、追加か置き換えかを議論できます。", pmPoint: "変更を扱うときは、現在の合意を基準に影響を比較します。" } },
      ],
    },
    {
      id: "analysis",
      title: "影響を見積もる",
      situation: "追加要件を入れるには、検索画面・API・テストの一部に変更が必要だと分かりました。",
      decisionPrompt: "どのように対応案を整理しますか？",
      choices: [
        { id: "build-all", title: "全機能を追加する前提で進める", description: "納期への影響は後で調整し、まず開発を開始します。", effects: { schedule: -8, quality: -5, businessValue: 2 }, hiddenEffects: { scopeCreep: 1, customerExpectationGap: 1 }, behaviorEvidence: [], feedback: { whatHappened: "作業は始まりましたが、テスト期間が圧迫されました。", why: "対応可否と影響を分けて検討しなかったため、納期と品質に余白がなくなりました。", pmPoint: "影響分析なしの受け入れは、後工程の負荷として現れます。" } },
        { id: "analyze", title: "工数・納期・品質への影響を比べる", description: "複数の条件で影響を整理し、判断材料を作ります。", effects: { riskExposure: -5, trust: 2 }, hiddenEffects: {}, behaviorEvidence: [{ areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 2 }], feedback: { whatHappened: "検索画面、API、テストそれぞれの影響と必要工数が見えるようになりました。", why: "判断を作業量だけでなく、納期と品質を含めて比較したためです。", pmPoint: "変更は複数の影響軸で整理すると、関係者と話しやすくなります。" } },
        { id: "alternative", title: "代替案を作る", description: "目的を保ちつつ、段階導入や既存機能の置き換えを含む案を比較します。", effects: { businessValue: 4, trust: 3, riskExposure: -4 }, hiddenEffects: {}, behaviorEvidence: [{ areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 2 }, { areaId: "business-value", elementId: "value", behavior: "business_value_check", weight: 1 }], feedback: { whatHappened: "目的を保ちながら納期を守れる段階導入案が候補になりました。", why: "機能を足すか断るかの二択にせず、価値を残す別案を考えたためです。", pmPoint: "代替案は、スコープ調整を前向きな選択肢に変えます。" } },
      ],
    },
    {
      id: "agreement",
      title: "関係者と合意する",
      situation: "顧客は便利さを期待しています。一方、開発チームは納期と品質への影響を懸念しています。",
      decisionPrompt: "どのように次の判断を合意しますか？",
      choices: [
        { id: "customer-only", title: "顧客担当者の希望で決める", description: "窓口との関係を優先して、その場で結論を出します。", effects: { trust: -4, quality: -3 }, hiddenEffects: { customerExpectationGap: 2 }, behaviorEvidence: [], feedback: { whatHappened: "後から開発側と決定権者に説明し直す必要が生まれました。", why: "関係者全体の前提と判断権限をそろえないまま結論を出したためです。", pmPoint: "合意には、誰が影響を受け、誰が決めるかの確認が欠かせません。" } },
        { id: "align", title: "目的と影響を共有して合意する", description: "関係者に選択肢とトレードオフを示し、納得できる着地点を作ります。", effects: { trust: 5, quality: 2, businessValue: 3, riskExposure: -5 }, hiddenEffects: { agreementRecorded: true, customerExpectationGap: -1 }, behaviorEvidence: [{ areaId: "stakeholders", elementId: "alignment", behavior: "consensus_building", weight: 2 }, { areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }, { areaId: "scope-control", elementId: "record", behavior: "written_agreement", weight: 1 }], feedback: { whatHappened: "段階導入の範囲と、次の判断時期を関係者が確認しました。", why: "目的・影響・選択肢を同じ資料で見たことで、期待値をそろえられました。", pmPoint: "合意は会話だけで終わらせず、決まったことを残します。" } },
        { id: "delay", title: "延期を提案する", description: "品質と全機能を優先し、リリース日を見直す選択肢を提示します。", effects: { schedule: -7, quality: 5, trust: -2, businessValue: 1 }, hiddenEffects: { customerExpectationGap: 1 }, behaviorEvidence: [{ areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }, { areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 1 }], feedback: { whatHappened: "品質を守る案として延期が検討されましたが、納期への期待を調整する必要が出ました。", why: "品質を守る代わりに、リリース時期への影響を引き受けたためです。", pmPoint: "延期も選択肢ですが、影響と代替案を添えて提案することが重要です。" } },
      ],
    },
  ],
  resolveConsequence: (hidden, eventIndex) => {
    if (eventIndex === 1 && hidden.scopeCreep > 0) return { effects: { schedule: -Math.min(12, hidden.scopeCreep * 5), quality: -hidden.scopeCreep * 2 }, whatHappened: "追加作業が既存のテスト計画に入り込み、余白が減りました。" };
    if (eventIndex === 2 && hidden.customerExpectationGap > 1) return { effects: { trust: -6, businessValue: -3 }, whatHappened: "関係者ごとの期待がずれ、最終判断に時間がかかりました。" };
    return null;
  },
};
