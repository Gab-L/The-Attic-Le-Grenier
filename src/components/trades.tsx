"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Repeat2,
  ArrowRight,
  Send,
  Clock3,
  ShieldBan,
  Flag,
  Plus,
  Check,
} from "lucide-react";
import type { GameState, Trade } from "@/lib/game";
import { api } from "@/lib/client";
import { Modal } from "./modal";
type Person = { id: string; handle: string };
type TradeItem = { id: string; definition_id: string };
const labels: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  declined: "Refusé",
  cancelled: "Annulé",
  expired: "Expiré",
};
export function Trades({
  state,
  refresh,
  notify,
  fail,
}: {
  state: GameState;
  refresh: () => Promise<unknown>;
  notify: (s: string) => void;
  fail: (s: string) => void;
}) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [blocks, setBlocks] = useState<Person[]>([]);
  const [create, setCreate] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searched, setSearched] = useState(false);
  const [target, setTarget] = useState<Person | null>(null);
  const [theirItems, setTheirItems] = useState<TradeItem[]>([]);
  const [offered, setOffered] = useState<string[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Person | null>(null);
  const [localError, setLocalError] = useState("");
  const key = useRef(crypto.randomUUID());
  const load = useCallback(async () => {
    const [t, b] = await Promise.all([
      api<Trade[]>("trades"),
      api<Person[]>("blocks"),
    ]);
    setTrades(t);
    setBlocks(b);
    setLoaded(true);
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([api<Trade[]>("trades"), api<Person[]>("blocks")])
      .then(([t, b]) => {
        if (active) {
          setTrades(t);
          setBlocks(b);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) fail(e.message);
      });
    return () => {
      active = false;
    };
  }, [fail]);
  const mine = state.inventory.filter(
    (i) =>
      !i.reserved_trade &&
      !state.player.room.placements.some((p) => p.instanceId === i.id),
  );
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      setResults(await api<Person[]>(`players?q=${encodeURIComponent(q)}`));
      setSearched(true);
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function choose(person: Person) {
    setBusy(true);
    setLocalError("");
    try {
      const items = await api<TradeItem[]>(
        `trade-inventory?player=${person.id}`,
      );
      setTarget(person);
      setTheirItems(items);
      setRequested([]);
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function toggle(id: string, ids: string[], set: (ids: string[]) => void) {
    if (ids.includes(id)) set(ids.filter((x) => x !== id));
    else if (ids.length < 6) set([...ids, id]);
  }
  async function send() {
    setBusy(true);
    setLocalError("");
    try {
      await api("trades", {
        recipient: target!.id,
        offered,
        requested,
        key: key.current,
      });
      key.current = crypto.randomUUID();
      setCreate(false);
      setTarget(null);
      setOffered([]);
      setRequested([]);
      await Promise.all([load(), refresh()]);
      notify(
        "Proposition envoyée. Vos exemplaires sont réservés pendant 72 heures.",
      );
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, act: string) {
    setBusy(true);
    try {
      await api("trade-action", { id, action: act });
      await Promise.all([load(), refresh()]);
      notify("L’échange a été mis à jour.");
    } catch (e) {
      fail((e as Error).message);
      await load();
    } finally {
      setBusy(false);
    }
  }
  async function social(
    person: Person,
    act: "block" | "unblock" | "report",
    reason?: string,
  ) {
    setBusy(true);
    try {
      await api("social", { target: person.id, action: act, reason });
      await Promise.all([load(), refresh()]);
      setReport(null);
      notify(
        act === "block"
          ? "Joueur bloqué et propositions en attente annulées."
          : act === "unblock"
            ? "Joueur débloqué."
            : "Signalement transmis à l’administration.",
      );
    } catch (e) {
      fail((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function itemPicker(
    items: TradeItem[],
    ids: string[],
    set: (ids: string[]) => void,
  ) {
    return (
      <div className="trade-item-picker">
        {items.map((i) => {
          const d = state.definitions.find((d) => d.id === i.definition_id)!;
          return (
            <button
              key={i.id}
              className={ids.includes(i.id) ? "selected" : ""}
              aria-pressed={ids.includes(i.id)}
              onClick={() => toggle(i.id, ids, set)}
            >
              <img src={d.illustration} alt="" width="62" height="62" />
              <span>
                {d.name}
                <small>n° {i.id.slice(0, 6)}</small>
              </span>
              {ids.includes(i.id) && <Check size={15} />}
            </button>
          );
        })}
        {!items.length && (
          <p className="note">
            Aucun exemplaire disponible. Un objet placé ou réservé ne peut pas
            être proposé.
          </p>
        )}
      </div>
    );
  }
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UN DOUBLON CONTRE UN NOUVEAU SOUVENIR</span>
          <h1>
            On échange<span className="title-dot">?</span>
          </h1>
          <p>
            De main en main, les histoires continuent. Toujours sans argent.
          </p>
        </div>
        <button className="button primary" onClick={() => setCreate(true)}>
          <Plus size={17} />
          Proposer un échange
        </button>
      </div>
      <div className="note inline">
        <Clock3 size={17} />
        Une proposition dure 72 heures. Seuls les objets de l’expéditeur sont
        réservés avant l’acceptation.
      </div>
      {!loaded ? (
        <p role="status">Les échanges arrivent…</p>
      ) : !trades.length ? (
        <div className="empty-state">
          <Repeat2 size={45} />
          <h2>Une place pour de nouvelles histoires.</h2>
          <p>Recherchez le pseudo d’un ami et proposez-lui un échange.</p>
          <button className="button secondary" onClick={() => setCreate(true)}>
            Trouver un collectionneur <Search size={16} />
          </button>
        </div>
      ) : (
        <div className="trade-list">
          {trades.map((t) => {
            const received = t.recipient_id === state.player.id;
            const other = {
              id: received ? t.sender_id : t.recipient_id,
              handle: received ? t.sender : t.recipient,
            };
            return (
              <article className="panel trade-card" key={t.id}>
                <div className="section-heading">
                  <h3>
                    {received ? "Proposition de" : "Proposition à"}{" "}
                    <b>{other.handle}</b>
                  </h3>
                  <span className={`trade-status ${t.status}`}>
                    {labels[t.status]}
                  </span>
                </div>
                <div className="trade-preview">
                  <div>
                    <span>{t.sender} propose</span>
                    <div>
                      {t.offered.map((id) => {
                        const d = state.definitions.find(
                          (d) =>
                            d.id ===
                            t.items.find((i) => i.id === id)?.definition_id,
                        );
                        return (
                          d && (
                            <img
                              key={id}
                              src={d.illustration}
                              alt={d.name}
                              title={d.name}
                              width="74"
                              height="74"
                            />
                          )
                        );
                      })}
                    </div>
                  </div>
                  <Repeat2 size={24} />
                  <div>
                    <span>{t.recipient} donne</span>
                    <div>
                      {t.requested.map((id) => {
                        const d = state.definitions.find(
                          (d) =>
                            d.id ===
                            t.items.find((i) => i.id === id)?.definition_id,
                        );
                        return (
                          d && (
                            <img
                              key={id}
                              src={d.illustration}
                              alt={d.name}
                              title={d.name}
                              width="74"
                              height="74"
                            />
                          )
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="muted">
                  {t.status === "pending"
                    ? `Expire le ${new Date(t.expires_at).toLocaleString("fr-FR")}`
                    : `Créé le ${new Date(t.created_at).toLocaleString("fr-FR")}`}
                </p>
                <div className="trade-actions">
                  {t.status === "pending" &&
                    (received ? (
                      <>
                        <button
                          disabled={busy}
                          className="button primary"
                          onClick={() => action(t.id, "accept")}
                        >
                          Accepter l’échange
                        </button>
                        <button
                          disabled={busy}
                          className="button secondary"
                          onClick={() => action(t.id, "decline")}
                        >
                          Refuser
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={busy}
                        className="button secondary"
                        onClick={() => action(t.id, "cancel")}
                      >
                        Annuler la proposition
                      </button>
                    ))}
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => social(other, "block")}
                  >
                    <ShieldBan size={15} />
                    Bloquer
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setReport(other)}
                  >
                    <Flag size={15} />
                    Signaler
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {blocks.length > 0 && (
        <section className="panel">
          <h2>Joueurs bloqués</h2>
          {blocks.map((p) => (
            <div className="instance-row" key={p.id}>
              <span>{p.handle}</span>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => social(p, "unblock")}
              >
                Débloquer
              </button>
            </div>
          ))}
        </section>
      )}
      {create && (
        <Modal
          title="Proposer un échange"
          wide
          onClose={() => setCreate(false)}
        >
          <span className="eyebrow">DE NOUVELLES HISTOIRES</span>
          <h2>Un souvenir contre un autre.</h2>
          {localError && (
            <p className="feedback error" role="alert">
              {localError}
            </p>
          )}
          <form className="trade-search" onSubmit={search}>
            <label className="search-field">
              <Search size={18} />
              <span className="sr-only">Pseudo du collectionneur</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Le pseudo d’un ami…"
                minLength={2}
                maxLength={24}
                required
              />
            </label>
            <button className="button secondary" disabled={busy}>
              Rechercher
            </button>
          </form>
          {results.length > 0 && (
            <div className="search-results">
              {results.map((p) => (
                <button
                  className={`button secondary ${target?.id === p.id ? "selected" : ""}`}
                  key={p.id}
                  onClick={() => choose(p)}
                  disabled={busy}
                >
                  {p.handle}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          )}
          {searched && !results.length && (
            <p className="muted">Aucun collectionneur trouvé pour ce pseudo.</p>
          )}
          {target && (
            <>
              <div className="trade-columns">
                <div>
                  <h3>
                    Je propose <small>{offered.length}/6</small>
                  </h3>
                  {itemPicker(mine, offered, setOffered)}
                </div>
                <div>
                  <h3>
                    Je demande à {target.handle}{" "}
                    <small>{requested.length}/6</small>
                  </h3>
                  {itemPicker(theirItems, requested, setRequested)}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="button primary"
                  disabled={busy || !offered.length || !requested.length}
                  onClick={send}
                >
                  <Send size={17} />
                  {busy ? "Envoi…" : "Envoyer la proposition"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      {report && (
        <Modal title="Signaler un joueur" onClose={() => setReport(null)}>
          <h2>Signaler {report.handle}</h2>
          <p>
            Décrivez le problème avec ce profil ou cette chambre. Ce message est
            visible uniquement par l’administration.
          </p>
          <form
            action={(data) =>
              social(report, "report", String(data.get("reason")))
            }
          >
            <label>
              Motif
              <textarea name="reason" required minLength={5} maxLength={500} />
            </label>
            <button disabled={busy} className="button primary">
              Envoyer le signalement
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
