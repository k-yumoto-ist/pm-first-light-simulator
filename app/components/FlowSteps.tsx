export type FlowStep = "situation" | "decision" | "result";

export function FlowSteps({ current }: { current: FlowStep }) {
  const steps: { id: FlowStep; index: string; label: string }[] = [
    { id: "situation", index: "1", label: "状況確認" },
    { id: "decision", index: "2", label: "PMの判断" },
    { id: "result", index: "3", label: "結果確認" },
  ];
  const currentIndex = steps.findIndex(step => step.id === current);
  return <nav className="flow-steps" aria-label="シミュレーションの進行">{steps.map((step, index) => { const complete = currentIndex > index; return <div key={step.id} className={`${step.id === current ? "current" : ""} ${complete ? "complete" : ""}`}><b>{complete ? "✓" : step.index}</b><span>{step.label}</span>{index < steps.length - 1 && <i />}</div>; })}</nav>;
}
