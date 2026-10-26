"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, Share2, Flag } from "lucide-react";
import { RoomScene } from "./room-scene";
import { exportRoom } from "@/lib/export-room";
import { shareLink, api } from "@/lib/client";
import { Modal } from "./modal";
import { badgeLabels } from "@/lib/catalog";
import type { publicRoom } from "@/lib/game";
export function PublicRoom({
  data,
  shareId,
}: {
  data: Awaited<ReturnType<typeof publicRoom>>;
  shareId: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  return (
    <main className="public-page">
      <Link className="brand" href="/">
        le grenier.
      </Link>
      <div className="public-heading">
        <span className="eyebrow">UNE PORTE OUVERTE SUR LES SOUVENIRS</span>
        <h1>La chambre de {data.handle}.</h1>
        <p className="muted">
          Collectionneur depuis le{" "}
          {new Date(data.joined).toLocaleDateString("fr-FR")} · Visite en
          lecture seule
        </p>
      </div>
      <RoomScene
        room={data.room}
        items={data.items}
        definitions={data.definitions}
        rewards={data.rewards}
        exportId="public-room-export"
      />
      <div className="public-badges">
        {data.badges.map((b) => (
          <span key={b}>{badgeLabels[b]}</span>
        ))}
      </div>
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      <div className="public-actions">
        <Link href="/" className="button primary">
          Ouvrir mon premier carton
        </Link>
        <button
          className="button secondary"
          onClick={() =>
            shareLink(location.href)
              .then(setMessage)
              .catch((e) => setMessage(e.message))
          }
        >
          <Share2 size={16} />
          Partager
        </button>
        <button
          disabled={busy}
          className="button secondary"
          onClick={async () => {
            setBusy(true);
            try {
              await exportRoom("public-room-export");
              setMessage("Image PNG téléchargée.");
            } catch {
              setMessage(
                "Export impossible dans ce navigateur. Vous pouvez faire une capture d’écran.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={16} />
          Capturer en PNG
        </button>
        <button className="text-button" onClick={() => setReport(true)}>
          <Flag size={14} /> Signaler cette chambre
        </button>
      </div>
      {report && (
        <Modal title="Signaler cette chambre" onClose={() => setReport(false)}>
          <h2>Un problème dans cette chambre ?</h2>
          <p>
            Un compte connecté est nécessaire pour envoyer un signalement. Le
            motif sera visible uniquement par l’administration.
          </p>
          {reportMessage && (
            <p className="feedback" role="status">
              {reportMessage}
            </p>
          )}
          <form
            action={async (form) => {
              setBusy(true);
              try {
                await api("report-room", {
                  shareId,
                  reason: String(form.get("reason")),
                });
                setReport(false);
                setMessage("Signalement transmis à l’administration.");
              } catch (e) {
                setReportMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Motif
              <textarea name="reason" required minLength={5} maxLength={500} />
            </label>
            <button className="button primary" disabled={busy}>
              Envoyer le signalement
            </button>
            <Link href="/">Revenir au jeu pour se connecter</Link>
          </form>
        </Modal>
      )}
    </main>
  );
}
