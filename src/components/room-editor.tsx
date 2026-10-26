"use client";
import { useState } from "react";
import {
  Download,
  Check,
  LoaderCircle,
  MousePointer2,
  Undo2,
  Palette,
  Share2,
  LockKeyhole,
} from "lucide-react";
import type { GameState } from "@/lib/game";
import { api, ApiError, shareLink } from "@/lib/client";
import { exportRoom } from "@/lib/export-room";
import { type Room, rarityLabels } from "@/lib/catalog";
import { RoomScene } from "./room-scene";
import { useTouchDrag } from "@/lib/use-touch-drag";
export function RoomEditor({
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
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState<Room | null>(null);
  const [exporting, setExporting] = useState(false);
  const room = state.player.room;
  const available = state.inventory.filter((i) => !i.reserved_trade);
  const selectedItem = available.find((i) => i.id === selected);
  const def = state.definitions.find(
    (d) => d.id === selectedItem?.definition_id,
  );
  const touch = useTouchDrag(
    (instanceId, slotId) =>
      void save({
        ...room,
        placements: [
          ...room.placements.filter((p) => p.instanceId !== instanceId),
          { instanceId, slotId },
        ],
      }),
  );
  async function save(next: Room) {
    if (saving) return;
    setSaving(true);
    setRetry(null);
    try {
      await api("room", { room: next, version: state.player.room_version });
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        await refresh();
      } else if (!(e instanceof ApiError && e.status < 500)) setRetry(next);
      fail((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function place(slot: string) {
    if (!selected) {
      notify("Sélectionnez d’abord un objet dans votre inventaire.");
      return;
    }
    void save({
      ...room,
      placements: [
        ...room.placements.filter((p) => p.instanceId !== selected),
        { instanceId: selected, slotId: slot },
      ],
    });
  }
  async function capture() {
    setExporting(true);
    try {
      await exportRoom("my-room-export");
      notify("Votre chambre a été exportée en PNG.");
    } catch (e) {
      fail(
        `${(e as Error).message} Vous pouvez aussi faire une capture d’écran.`,
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UN PETIT COIN DE VOUS</span>
          <h1>
            Ma chambre<span className="title-dot">.</span>
          </h1>
          <p>Chaque objet a sa place. Chaque place, son histoire.</p>
        </div>
        <span className={`save-status ${retry ? "error" : ""}`} role="status">
          {saving ? (
            <>
              <LoaderCircle size={16} className="spin" />
              Enregistrement…
            </>
          ) : retry ? (
            <button onClick={() => save(retry)}>
              Réessayer l’enregistrement
            </button>
          ) : (
            <>
              <Check size={16} /> Enregistré
            </>
          )}
        </span>
      </div>
      <div className="room-editor-layout">
        <div>
          <div className="room-canvas-wrap">
            <RoomScene
              room={room}
              items={state.inventory}
              definitions={state.definitions}
              rewards={state.player.rewards}
              editable={!saving}
              selected={selected}
              onSlot={place}
              onItem={setSelected}
              exportId="my-room-export"
            />
            <div className="room-canvas-caption">
              <span>
                <MousePointer2 size={15} />
                {selected
                  ? `${def?.name} : choisissez un emplacement.`
                  : "Choisissez un objet, puis sa place."}
              </span>
              <span>
                {room.placements.length} objet
                {room.placements.length > 1 ? "s" : ""} placé
                {room.placements.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="room-tools">
            <button
              className="button secondary"
              disabled={exporting}
              onClick={capture}
            >
              <Download size={16} />
              {exporting ? "Export en cours…" : "Capturer en PNG"}
            </button>
            {state.player.public ? (
              <button
                className="button secondary"
                onClick={() =>
                  shareLink(
                    `${location.origin}/chambre/${state.player.share_id}`,
                  )
                    .then(notify)
                    .catch((e) => fail(e.message))
                }
              >
                <Share2 size={16} />
                Partager ma chambre
              </button>
            ) : (
              <span className="quiet-note">
                <LockKeyhole size={14} /> Privée · Publication depuis le profil
              </span>
            )}
          </div>
          <div className="decor-panel">
            <h3>
              <Palette size={18} /> Les couleurs de vos souvenirs
            </h3>
            <div className="theme-options">
              {[
                {
                  id: "warm",
                  label: "Bois chaleureux",
                  wall: "cream",
                  floor: "honey",
                },
                {
                  id: "pastel",
                  label: "Pastel des années 90",
                  wall: "pink",
                  floor: "light",
                },
                {
                  id: "night",
                  label: "Rêves des années 2000",
                  wall: "blue",
                  floor: "dark",
                },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`theme-option ${room.theme === t.id ? "selected" : ""} ${t.id}`}
                  disabled={saving}
                  onClick={() =>
                    save({
                      ...room,
                      theme: t.id as Room["theme"],
                      wall: t.wall as Room["wall"],
                      floor: t.floor as Room["floor"],
                    })
                  }
                >
                  <span className="theme-swatch" />
                  {t.label}
                  {room.theme === t.id && <Check size={14} />}
                </button>
              ))}
            </div>
            <div className="color-options">
              <label>
                Couleur du mur
                <select
                  disabled={saving}
                  value={room.wall}
                  onChange={(e) =>
                    save({ ...room, wall: e.target.value as Room["wall"] })
                  }
                >
                  <option value="cream">Crème</option>
                  <option value="pink">Rose poudré</option>
                  <option value="blue">Bleu brume</option>
                </select>
              </label>
              <label>
                Couleur du sol
                <select
                  disabled={saving}
                  value={room.floor}
                  onChange={(e) =>
                    save({ ...room, floor: e.target.value as Room["floor"] })
                  }
                >
                  <option value="honey">Bois miel</option>
                  <option value="light">Bois clair</option>
                  <option value="dark">Bois brun</option>
                </select>
              </label>
            </div>
            {state.player.rewards.length > 0 && (
              <p className="note">
                Décorations débloquées et affichées :{" "}
                {state.collections
                  .filter((c) => state.player.rewards.includes(c.id))
                  .map((c) => c.reward)
                  .join(", ")}
                .
              </p>
            )}
          </div>
        </div>
        <aside className="inventory-panel">
          <div>
            <span className="eyebrow">À VOUS DE JOUER</span>
            <h2>Vos petits trésors</h2>
            <p>
              Cliquez puis placez, ou glissez un objet vers un emplacement
              pointillé.
            </p>
          </div>
          {!available.length && (
            <p className="note">
              Vos trouvailles disponibles apparaîtront ici après l’ouverture
              d’un carton.
            </p>
          )}
          <div className="inventory-items">
            {available.map((i) => {
              const d = state.definitions.find(
                (d) => d.id === i.definition_id,
              )!;
              const placed = room.placements.some((p) => p.instanceId === i.id);
              return (
                <button
                  key={i.id}
                  className={`inventory-item ${selected === i.id ? "selected" : ""}`}
                  aria-pressed={selected === i.id}
                  disabled={saving}
                  draggable
                  onDragStart={(e) => {
                    setSelected(i.id);
                    e.dataTransfer.setData("text/plain", i.id);
                  }}
                  onClick={() => setSelected(i.id)}
                  {...touch.handlers(i.id)}
                >
                  <img src={d.illustration} alt="" width="61" height="61" />
                  <span>
                    <b>{d.name}</b>
                    <small>
                      {placed ? "Dans la chambre" : rarityLabels[d.rarity]}
                    </small>
                  </span>
                  {placed && <Check size={14} />}
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="selection-panel">
              <p>
                <b>{def?.name}</b>
                <br />
                {def?.width} emplacement{def && def.width > 1 ? "s" : ""} ·{" "}
                {def?.surfaces
                  .map(
                    (s) =>
                      ({ shelf: "étagère", desk: "bureau", floor: "sol" })[s],
                  )
                  .join(", ")}
              </p>
              {room.placements.some((p) => p.instanceId === selected) && (
                <button
                  className="button secondary"
                  disabled={saving}
                  onClick={() =>
                    save({
                      ...room,
                      placements: room.placements.filter(
                        (p) => p.instanceId !== selected,
                      ),
                    })
                  }
                >
                  <Undo2 size={15} /> Remettre dans le carton
                </button>
              )}
              <button className="text-button" onClick={() => setSelected(null)}>
                Terminer la sélection
              </button>
            </div>
          )}
          <div className="note">
            Un exemplaire placé ne peut pas être échangé. Retirez-le de la
            chambre pour le rendre disponible.
          </div>
        </aside>
      </div>
      {touch.ghost && (
        <img
          className="drag-ghost"
          alt=""
          src={
            state.definitions.find(
              (d) =>
                d.id ===
                available.find((i) => i.id === touch.ghost!.id)?.definition_id,
            )?.illustration
          }
          style={{ left: touch.ghost.x - 35, top: touch.ghost.y - 40 }}
          width="70"
          height="70"
        />
      )}
    </section>
  );
}
