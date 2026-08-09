export type FlowStep = "situation" | "decision" | "result";

export function FlowSteps({ current }: { current: FlowStep }) {
  const steps: { id: FlowStep; index: string; label: string }[] = [
    { id: "situation", index: "1", label: "状況確認" },
    { id: "decision", index: "2", label: "PMの判断" },
    { id: "result", index: "3", label: "結果確認" },
  ];
  return <nav className="flow-steps" aria-label="シミュレーションの進行">{steps.map((step, index) => <div key={step.id} className={`${step.id === current ? "current" : ""} ${steps.findIndex(s => s.id === current) > index ? "complete" : ""}`}><b>{step.index}</b><span>{step.label}</span>{index < steps.length - 1 && <i />}</div>)}</nav>;
}
