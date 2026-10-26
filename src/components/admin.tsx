"use client";
import { useCallback, useEffect, useState } from "react";
import { Shield, Save } from "lucide-react";
import type { getAdmin } from "@/lib/game";
import { rarities, rarityLabels } from "@/lib/catalog";
import { api } from "@/lib/client";
type Data = Awaited<ReturnType<typeof getAdmin>>;
export function Admin({
  notify,
  fail,
  refresh,
}: {
  notify: (s: string) => void;
  fail: (s: string) => void;
  refresh: () => Promise<unknown>;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [selected, setSelected] = useState("bille");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setData(await api<Data>("admin")), []);
  useEffect(() => {
    let active = true;
    api<Data>("admin")
      .then((data) => {
        if (active) setData(data);
      })
      .catch((e) => {
        if (active) fail(e.message);
      });
    return () => {
      active = false;
    };
  }, [fail]);
  async function save(change: unknown) {
    setBusy(true);
    try {
      await api("admin", change);
      await Promise.all([load(), refresh()]);
      notify("Modification enregistrée dans le journal d’administration.");
    } catch (e) {
      fail((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="empty-state">
        <p>Chargement de l’administration…</p>
        <button
          className="button secondary"
          onClick={() => load().catch((e) => fail(e.message))}
        >
          Réessayer
        </button>
      </div>
    );
  const d = data.definitions.find((d) => d.id === selected)!;
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <Shield size={15} /> ACCÈS RESTREINT
          </span>
          <h1>Les coulisses du grenier.</h1>
        </div>
      </div>
      <div className="admin-grid">
        <section className="panel">
          <h2>Catalogue</h2>
          <label>
            Objet
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {data.definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {!d.active ? " (archivé)" : ""}
                </option>
              ))}
            </select>
          </label>
          <form
            key={`${selected}-${d.name}-${d.active}-${d.rarity}`}
            action={(form) =>
              save({
                definition: {
                  id: d.id,
                  name: String(form.get("name")),
                  description: String(form.get("description")),
                  rarity: String(form.get("rarity")),
                  active: form.get("active") === "on",
                },
              })
            }
          >
            <img src={d.illustration} width="100" height="100" alt={d.name} />
            <label>
              Nom
              <input
                name="name"
                defaultValue={d.name}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={d.description}
                required
                minLength={10}
                maxLength={400}
              />
            </label>
            <label>
              Rareté
              <select name="rarity" defaultValue={d.rarity}>
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    {rarityLabels[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle-row">
              <input type="checkbox" name="active" defaultChecked={d.active} />{" "}
              Disponible dans les tirages
            </label>
            <p className="note">
              Un objet archivé reste dans les inventaires et les chambres. Les
              illustrations, dimensions et identifiants restent stables.
            </p>
            <button disabled={busy} className="button primary">
              <Save size={15} />
              Enregistrer l’objet
            </button>
          </form>
        </section>
        <section className="panel">
          <h2>Distribution</h2>
          <form
            key={JSON.stringify(data.settings)}
            action={(form) =>
              save({
                settings: Object.fromEntries(
                  [...rarities, "rechargeHours"].map((r) => [
                    r,
                    Number(form.get(r)),
                  ]),
                ),
              })
            }
          >
            {rarities.map((r) => (
              <label key={r}>
                {rarityLabels[r]} (%)
                <input
                  name={r}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue={data.settings[r]}
                  required
                />
              </label>
            ))}
            <label>
              Délai de recharge (heures)
              <input
                name="rechargeHours"
                type="number"
                min="1"
                max="48"
                step="1"
                defaultValue={data.settings.rechargeHours}
                required
              />
            </label>
            <p className="note">
              Total obligatoire : 100 %. Chaque rareté doit conserver un objet
              actif. La progression de recharge est préservée lors d’un
              changement de délai.
            </p>
            <button className="button primary" disabled={busy}>
              Enregistrer les règles
            </button>
          </form>
        </section>
      </div>
      <section className="panel">
        <h2>Signalements</h2>
        {data.reports.length ? (
          data.reports.map((r) => (
            <div className="report-row" key={r.id}>
              <b>{r.handle}</b>
              <p>{r.reason}</p>
              <span>{r.status === "resolved" ? "Traité" : "À examiner"}</span>
              {r.status === "open" && (
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() => save({ reportId: r.id })}
                >
                  Marquer comme traité
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="muted">Aucun signalement.</p>
        )}
      </section>
      <div className="admin-grid">
        <section className="panel">
          <h2>Dernières ouvertures</h2>
          <div className="audit-list">
            {data.openings.map((o) => (
              <div key={o.id}>
                <b>{o.handle}</b> ·{" "}
                {new Date(o.created_at).toLocaleString("fr-FR")}
                <small>{o.id}</small>
                <p>
                  {o.results
                    .map(
                      (r: { definitionId: string }) =>
                        data.definitions.find((d) => d.id === r.definitionId)
                          ?.name,
                    )
                    .join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Échanges et audit</h2>
          <div className="audit-list">
            {data.trades.map((t) => (
              <div key={t.id}>
                <b>{t.status}</b>
                <small>{t.id}</small>
                {new Date(t.created_at).toLocaleString("fr-FR")}
              </div>
            ))}
            {data.audit.map((a, i) => (
              <div key={i}>
                <b>{a.action}</b> ·{" "}
                {new Date(a.created_at).toLocaleString("fr-FR")}
                <pre>{JSON.stringify(a.details, null, 2)}</pre>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
