"use client";

import { useEffect, useState } from "react";

type Props = {
  canUndo: boolean;
  onSave: () => boolean;
  onUndo: () => void;
  onRestart: () => void;
  onExit: (save: boolean) => void;
};

export function PlayNavigationMenu({ canUndo, onSave, onUndo, onRestart, onExit }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<"restart" | "exit" | null>(null);
  const [saveNotice, setSaveNotice] = useState<"success" | "error" | null>(null);
  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);
  const close = () => { setOpen(false); setConfirm(null); };
  const save = () => {
    setSaveNotice(onSave() ? "success" : "error");
    close();
  };
  return <>
    <button type="button" className="play-menu-trigger" aria-label="プレイメニューを開く" aria-expanded={open} onClick={() => setOpen(true)}>メニュー ⋯</button>
    {saveNotice ? <div className={`play-save-toast ${saveNotice}`} role="status" aria-live="polite">
      {saveNotice === "success" ? "プレイ状況を保存しました" : "プレイ状況を保存できませんでした。ブラウザの保存設定を確認してください。"}
    </div> : null}
    {open ? <div className="play-menu-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && close()}>
      <section className="play-menu" role="dialog" aria-modal="true" aria-label="プレイメニュー">
        {!confirm ? <>
          <header><strong>プレイメニュー</strong><button type="button" aria-label="閉じる" onClick={close}>×</button></header>
          <button type="button" onClick={save}>一時保存する</button>
          <button type="button" disabled={!canUndo} onClick={() => { onUndo(); close(); }}>一つ前の選択に戻る</button>
          <button type="button" onClick={() => setConfirm("restart")}>最初からやり直す</button>
          <button type="button" className="play-menu-danger" onClick={() => setConfirm("exit")}>モード選択へ戻る</button>
        </> : confirm === "restart" ? <>
          <header><strong>最初からやり直しますか？</strong><button type="button" aria-label="閉じる" onClick={close}>×</button></header>
          <p>現在のプレイ内容はリセットされます。モード・テーマ・難易度はそのままです。</p>
          <footer><button type="button" className="v2-secondary" onClick={() => setConfirm(null)}>キャンセル</button><button type="button" className="primary" onClick={() => { onRestart(); close(); }}>最初からやり直す</button></footer>
        </> : <>
          <header><strong>モード選択へ戻りますか？</strong><button type="button" aria-label="閉じる" onClick={close}>×</button></header>
          <p>プレイ中の内容があります。保存しておけば、あとで同じ地点から再開できます。</p>
          <footer className="play-menu-exit-actions"><button type="button" className="v2-secondary" onClick={close}>キャンセル</button><button type="button" className="v2-secondary" onClick={() => { onExit(false); close(); }}>保存せず戻る</button><button type="button" className="primary" onClick={() => { onExit(true); close(); }}>保存して戻る</button></footer>
        </>}
      </section>
    </div> : null}
  </>;
}
