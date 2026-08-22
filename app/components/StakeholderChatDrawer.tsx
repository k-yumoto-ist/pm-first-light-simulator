export type ChatStakeholder = {
  id: string;
  name: string;
  role: string;
  initials: string;
  colorClass?: string;
  status?: string;
};

export type StakeholderChatMessage = {
  id: string;
  speaker: "player" | "stakeholder";
  text: string;
};

export type StakeholderChatQuestion = {
  id: string;
  label: string;
  disabled?: boolean;
  statusLabel?: string;
};

const avatarClass = (stakeholder: ChatStakeholder) => `avatar ${stakeholder.colorClass ?? "mode-avatar"}`;

export function StakeholderContactPicker({ stakeholders, actionCostLabel = "質問を選んだ時点で Action × 1", onSelect, onClose }: { stakeholders: ChatStakeholder[]; actionCostLabel?: string; onSelect: (id: string) => void; onClose: () => void }) {
  return <AccessibleDialog onClose={onClose} labelledBy="stakeholder-picker-title" overlayClassName="contact-picker-backdrop" dialogClassName="contact-picker contact-picker-overlay">
    <header><div><span id="stakeholder-picker-title">話す相手を選ぶ</span><small>{actionCostLabel}</small></div><button type="button" onClick={onClose}>閉じる</button></header>
    <div>{stakeholders.map(person => <button key={person.id} type="button" onClick={() => onSelect(person.id)}><span className={avatarClass(person)}>{person.initials}</span><span><strong>{person.name}</strong><small>{person.role}</small>{person.status ? <em>{person.status}</em> : null}</span><b>質問を見る</b></button>)}</div>
  </AccessibleDialog>;
}

export function StakeholderChatDrawer({ stakeholder, messages, questions, actionsLeft, disabled, helperText, onSelectQuestion, onClose }: { stakeholder: ChatStakeholder; messages: StakeholderChatMessage[]; questions: StakeholderChatQuestion[]; actionsLeft: number; disabled: boolean; helperText?: string; onSelectQuestion: (id: string) => void; onClose: () => void }) {
  return <AccessibleDialog onClose={onClose} labelledBy="stakeholder-chat-title" overlayClassName="drawer-backdrop" dialogClassName="chat-drawer">
      <header><span className={avatarClass(stakeholder)}>{stakeholder.initials}</span><div><strong id="stakeholder-chat-title">{stakeholder.name}</strong><small>{stakeholder.role}</small></div><button type="button" aria-label="会話を閉じる" onClick={onClose}>×</button></header>
      <div className="chat-history">
        {messages.length === 0 ? <div className="chat-intro"><span className={avatarClass(stakeholder)}>{stakeholder.initials}</span><p>{stakeholder.name}さんに、何を確認しますか？<br />質問の具体性で得られる情報が変わります。</p></div> : null}
        {messages.map(message => <div key={message.id} className={`bubble ${message.speaker === "player" ? "mine" : "theirs"}`}><small>{message.speaker === "player" ? "あなた" : stakeholder.name}</small><p>{message.text}</p></div>)}
      </div>
      <div className="topic-list"><div><strong>何について聞きますか？</strong><small>{helperText ?? `残り ${actionsLeft} Action`}</small></div>{questions.length ? questions.map(question => <button key={question.id} type="button" disabled={disabled || question.disabled} onClick={() => onSelectQuestion(question.id)}><span>{question.label}</span><b>{question.statusLabel ?? (question.disabled ? "確認済み" : "実行前に確認")}</b></button>) : <p className="chat-no-questions">この時点で確認できる質問はありません。</p>}</div>
  </AccessibleDialog>;
}
import { AccessibleDialog } from "./AccessibleDialog";
