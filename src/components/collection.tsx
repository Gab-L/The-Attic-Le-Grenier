"use client";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Heart,
  House,
  LockKeyhole,
  Gift,
  X,
} from "lucide-react";
import { api } from "@/lib/client";
import { rarities, rarityLabels, type Definition } from "@/lib/catalog";
import type { GameState } from "@/lib/game";
import { Modal } from "./modal";
export function Collection({
  state,
  refresh,
  onDecorate,
  notify,
  fail,
}: {
  state: GameState;
  refresh: () => Promise<unknown>;
  onDecorate: () => void;
  notify: (s: string) => void;
  fail: (s: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("");
  const [rarity, setRarity] = useState("");
  const [group, setGroup] = useState("");
  const [show, setShow] = useState("all");
  const [sort, setSort] = useState("collection");
  const [detail, setDetail] = useState<Definition | null>(null);
  const [busy, setBusy] = useState(false);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        state.definitions.map((d) => [
          d.id,
          state.inventory.filter((i) => i.definition_id === d.id).length,
        ]),
      ),
    [state],
  );
  const filtered = state.definitions
    .filter(
      (d) =>
        (!query ||
          `${d.name} ${d.description}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!period || d.period === period) &&
        (!rarity || d.rarity === rarity) &&
        (!group || d.collection_id === group) &&
        (show === "all" ||
          (show === "owned" && counts[d.id] > 0) ||
          (show === "missing" && !counts[d.id]) ||
          (show === "duplicates" && counts[d.id] > 1) ||
          (show === "favorites" && state.player.favorites.includes(d.id))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "fr")
        : sort === "rarity"
          ? rarities.indexOf(b.rarity) - rarities.indexOf(a.rarity)
          : sort === "recent"
            ? Math.max(
                0,
                ...state.inventory
                  .filter((i) => i.definition_id === b.id)
                  .map((i) => new Date(i.acquired_at).getTime()),
              ) -
              Math.max(
                0,
                ...state.inventory
                  .filter((i) => i.definition_id === a.id)
                  .map((i) => new Date(i.acquired_at).getTime()),
              )
            : a.collection_id.localeCompare(b.collection_id),
    );
  async function favorite(id: string) {
    setBusy(true);
    try {
      await api("profile", { favorite: id });
      await refresh();
    } catch (e) {
      fail((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LES PETITES CHOSES QU’ON GARDE</span>
          <h1>
            Ma collection<span className="title-dot">.</span>
          </h1>
          <p>
            {state.player.discoveries.length} souvenirs découverts sur{" "}
            {state.definitions.length}. Et tant d’histoires à retrouver.
          </p>
        </div>
        <span className="big-counter">
          {state.inventory.length}
          <small>objets dans mes cartons</small>
        </span>
      </div>
      <div className="collection-progress">
        {state.collections.map((c) => {
          const found = state.definitions.filter(
            (d) =>
              d.collection_id === c.id &&
              state.player.discoveries.includes(d.id),
          ).length;
          return (
            <button
              className={`collection-group ${group === c.id ? "selected" : ""}`}
              key={c.id}
              onClick={() => setGroup(group === c.id ? "" : c.id)}
              aria-pressed={group === c.id}
            >
              <span>
                {c.name}
                <b>{found}/6</b>
              </span>
              <div className="progress-track">
                <i style={{ width: `${(found / 6) * 100}%` }} />
              </div>
              <small>
                <Gift size={12} />
                {found === 6
                  ? c.reward
                  : `À débloquer : ${c.reward.toLowerCase()}`}
              </small>
            </button>
          );
        })}
      </div>
      <div className="collection-toolbar">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Rechercher un objet</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Un souvenir en tête ?"
          />
        </label>
        <label>
          <span className="sr-only">Période</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Toutes les époques</option>
            {["1990", "2000", "2010"].map((p) => (
              <option key={p} value={p}>
                Années {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Rareté</span>
          <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
            <option value="">Toutes les raretés</option>
            {rarities.map((r) => (
              <option key={r} value={r}>
                {rarityLabels[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Trier les objets</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="collection">Par collection</option>
            <option value="name">Par nom</option>
            <option value="rarity">Par rareté</option>
            <option value="recent">Plus récents</option>
          </select>
        </label>
      </div>
      <div className="filter-tabs">
        {[
          ["all", "Tous les souvenirs"],
          ["owned", "Mes objets"],
          ["missing", "À découvrir"],
          ["duplicates", "Doublons"],
          ["favorites", "Favoris"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={show === id ? "selected" : ""}
            onClick={() => setShow(id)}
          >
            {label}
          </button>
        ))}
        {group && (
          <button onClick={() => setGroup("")}>
            <X size={13} /> Effacer la collection
          </button>
        )}
        <span>{filtered.length} objets</span>
      </div>
      <div className="object-grid">
        {filtered.map((d) => (
          <article
            className={`object-card ${!counts[d.id] ? "missing" : ""}`}
            key={d.id}
          >
            <button
              className={`favorite-button ${state.player.favorites.includes(d.id) ? "is-favorite" : ""}`}
              disabled={busy}
              aria-label={`${state.player.favorites.includes(d.id) ? "Retirer des" : "Ajouter aux"} favoris : ${d.name}`}
              onClick={() => favorite(d.id)}
            >
              <Heart
                size={17}
                fill={
                  state.player.favorites.includes(d.id)
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
            <button className="object-detail" onClick={() => setDetail(d)}>
              <div className="object-art">
                <img
                  src={d.illustration}
                  width="150"
                  height="150"
                  loading="lazy"
                  alt={counts[d.id] ? d.name : `Silhouette : ${d.name}`}
                />
                {!counts[d.id] && <LockKeyhole size={18} />}
              </div>
              <div className="object-info">
                <span className={`rarity ${d.rarity}`}>
                  {rarityLabels[d.rarity]}
                </span>
                <h3>{d.name}</h3>
                <div>
                  <span>Années {d.period}</span>
                  <span>
                    {counts[d.id] ? `× ${counts[d.id]}` : "À découvrir"}
                  </span>
                </div>
              </div>
            </button>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state small">
          <SlidersHorizontal size={32} />
          <h2>Aucun souvenir par ici.</h2>
          <p>Essayez d’autres filtres ou un autre mot.</p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setPeriod("");
              setRarity("");
              setGroup("");
              setShow("all");
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="item-sheet">
            <img
              src={detail.illustration}
              alt={detail.name}
              width="200"
              height="200"
            />
            <span className={`rarity ${detail.rarity}`}>
              {rarityLabels[detail.rarity]}
            </span>
            <h2>{detail.name}</h2>
            <p className="muted">
              Années {detail.period} · {detail.category}
            </p>
            <p>{detail.description}</p>
            <p className="muted">
              Encombrement : {detail.width} emplacement
              {detail.width > 1 ? "s" : ""} ·{" "}
              {detail.surfaces
                .map(
                  (s) =>
                    ({ shelf: "étagère", desk: "bureau", floor: "sol" })[s],
                )
                .join(", ")}
            </p>
            <h3>
              {counts[detail.id]} exemplaire{counts[detail.id] > 1 ? "s" : ""}{" "}
              possédé{counts[detail.id] > 1 ? "s" : ""}
            </h3>
            {state.inventory
              .filter((i) => i.definition_id === detail.id)
              .map((i) => (
                <div className="instance-row" key={i.id}>
                  <span>
                    {new Date(i.acquired_at).toLocaleDateString("fr-FR")}
                    <small>n° {i.id.slice(0, 8)}</small>
                  </span>
                  <span>
                    {i.reserved_trade
                      ? "Réservé"
                      : state.player.room.placements.some(
                            (p) => p.instanceId === i.id,
                          )
                        ? "Dans la chambre"
                        : "Disponible"}
                  </span>
                </div>
              ))}
            {state.inventory.some(
              (i) => i.definition_id === detail.id && !i.reserved_trade,
            ) ? (
              <button
                className="button primary"
                onClick={() => {
                  setDetail(null);
                  onDecorate();
                  notify(
                    `Sélectionnez ${detail.name} puis un emplacement dans votre chambre.`,
                  );
                }}
              >
                <House size={17} /> Placer dans ma chambre
              </button>
            ) : (
              <p className="note">
                {counts[detail.id]
                  ? "Vos exemplaires sont réservés pour un échange."
                  : "Ce souvenir attend dans un prochain carton."}
              </p>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
