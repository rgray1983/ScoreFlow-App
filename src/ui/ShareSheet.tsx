import { useEffect, useState } from "react";
import { Button } from "./Button";
import { CloseIcon } from "./icons";
import { qrDataUrl } from "../live";
import styles from "./ShareSheet.module.css";

type ShareSheetProps = {
  open: boolean;
  url: string;
  onClose: () => void;
};

export function ShareSheet({ open, url, onClose }: ShareSheetProps) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !url) {
      setQr("");
      return;
    }
    let cancelled = false;
    void qrDataUrl(url).then((image) => {
      if (!cancelled) setQr(image);
    });
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  if (!open) return null;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "ScoreFlow Live", text: "Follow the live score here:", url });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
    await copyLink();
  }

  return (
    <div className={styles.shade} role="presentation" onClick={onClose}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(event) => event.stopPropagation()}>
        <div className={styles.head}>
          <h2 id="share-title">Share Live</h2>
          <button className={styles.close} type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <p>Family opens this viewer link. Your phone stays on the scorer.</p>
        {qr ? <img className={styles.qr} src={qr} alt="QR code for the live viewer link" /> : <div className={styles.qrSlot} />}
        <input className={styles.link} readOnly value={url} aria-label="Viewer link" onFocus={(event) => event.currentTarget.select()} />
        <div className={styles.actions}>
          <Button tone="gold" onClick={() => void shareLink()}>Share Link</Button>
          <Button tone="quiet" onClick={() => void copyLink()}>{copied ? "Copied" : "Copy Link"}</Button>
        </div>
      </div>
    </div>
  );
}
