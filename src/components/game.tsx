"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  BookOpen,
  House,
  Repeat2,
  UserRound,
  Sparkles,
  Clock3,
  ShieldCheck,
  Volume2,
  VolumeX,
  Check,
  X,
  Heart,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { api, ApiError } from "@/lib/client";
import { catalogue, collections, rarityLabels, type Room } from "@/lib/catalog";
import type { GameState, Opening } from "@/lib/game";
import { RoomScene, Cardboard } from "./room-scene";
import { Modal } from "./modal";
import { Collection } from "./collection";
import { RoomEditor } from "./room-editor";
import { AuthForm, Profile } from "./profile";
import { Trades } from "./trades";
import { Admin } from "./admin";
type Tab = "home" | "collection" | "room" | "trades" | "profile" | "admin";
const nav = [
  { id: "home", label: "Mon grenier", icon: Box },
  { id: "collection", label: "Collection", icon: BookOpen },
  { id: "room", label: "Ma chambre", icon: House },
  { id: "trades", label: "Échanges", icon: Repeat2 },
  { id: "profile", label: "Profil", icon: UserRound },
] as const;
const demoIds = [
  "portable",
  "cassette",
  "lampe",
  "robot",
  "globe",
  "baladeur",
  "ecran",
  "clavier",
  "trousse",
  "telephone",
  "bille",
  "radio",
];
const demoSlots = [
  "haut-0",
  "haut-1",
  "haut-2",
  "haut-3",
  "haut-4",
  "haut-5",
  "bureau-0",
  "bureau-2",
  "bas-0",
  "bas-1",
  "bas-2",
  "bas-3",
];
const demoItems = demoIds.map((id) => ({
  id: `demo-${id}`,
  definition_id: id,
}));
export const demoRoom: Room = {
  theme: "warm",
  wall: "cream",
  floor: "honey",
  placements: demoItems.map((item, i) => ({
    instanceId: item.id,
    slotId: demoSlots[i],
  })),
};
export function Game() {
  const [tab, setTab] = useState<Tab>("home");
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<Opening | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "login" | null>(null);
  const [demo, setDemo] = useState(false);
  const [sound, setSound] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const key = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    const data = await api<GameState>("state");
    setState(data);
    return data;
  }, []);
  useEffect(() => {
    let active = true;
    api<GameState>("state")
      .then((data) => {
        if (active) setState(data);
      })
      .catch((e) => {
        if (active && !(e instanceof ApiError && e.status === 401))
          setError(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!state?.nextAt) return;
    const start = performance.now();
    const delta =
      new Date(state.nextAt).getTime() - new Date(state.serverNow).getTime();
    const tick = () =>
      setRemaining(Math.max(0, delta - (performance.now() - start)));
    const timer = setInterval(tick, 1000);
    const initial = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
    };
  }, [state]);
  useEffect(() => {
    const onFocus = () => {
      if (state) refresh().catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [state, refresh]);
  const notify = (s: string) => {
    setNotice(s);
    setError("");
  };
  async function open() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      let current = state;
      if (!current) {
        const session = await authClient.signIn.anonymous();
        if (session.error)
          throw new Error(
            "La visite ne peut pas commencer. Réessayez dans quelques instants.",
          );
        current = await refresh();
      }
      if (!key.current) {
        try {
          key.current = sessionStorage.getItem("grenier-opening");
        } catch {}
        key.current ??= crypto.randomUUID();
        try {
          sessionStorage.setItem("grenier-opening", key.current);
        } catch {}
      }
      const result = await api<Opening>("open", { key: key.current });
      key.current = null;
      try {
        sessionStorage.removeItem("grenier-opening");
      } catch {}
      setOpening(result);
      await refresh();
      if (sound) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(() => void ctx.close(), 700);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ouverture impossible.");
    } finally {
      setBusy(false);
    }
  }
  async function changeTab(next: Tab) {
    if (!state && next !== "home") {
      setNotice("Ouvrez votre premier carton pour commencer votre collection.");
      return;
    }
    setTab(next);
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error)
        throw new Error("La déconnexion a échoué. Réessayez dans un instant.");
      setState(null);
      setTab("home");
      notify("Vous êtes déconnecté.");
    } catch {
      setError(
        "La déconnexion a échoué. Vérifiez votre connexion et réessayez.",
      );
    }
  }
  const timer = state?.nextAt
    ? `${Math.floor(remaining / 3600000)} h ${String(Math.floor(remaining / 60000) % 60).padStart(2, "0")} min`
    : "Réserve pleine";
  return (
    <>
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => void changeTab("home")}
            aria-label="Le Grenier, accueil"
          >
            <span className="brand-mark">
              <Box size={24} strokeWidth={1.5} />
            </span>
            <span>
              le grenier<span className="brand-dot">.</span>
              <small>LES SOUVENIRS SE COLLECTIONNENT</small>
            </span>
          </button>
          <nav aria-label="Navigation principale">
            {nav.map((n) => (
              <button
                key={n.id}
                className={tab === n.id ? "active" : ""}
                onClick={() => void changeTab(n.id)}
              >
                <n.icon size={17} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="header-actions">
            {state ? (
              <>
                <span className="stock-pill">
                  <Box size={16} />
                  {state.player.stock}
                  <span>/ 4</span>
                </span>
                <button
                  className="avatar"
                  onClick={() =>
                    state.player.is_anonymous
                      ? setAuthMode("signup")
                      : void changeTab("profile")
                  }
                  aria-label={
                    state.player.is_anonymous
                      ? "Créer mon compte"
                      : `Compte ${state.player.handle}`
                  }
                >
                  {state.player.is_anonymous ? (
                    <UserRound size={18} />
                  ) : (
                    state.player.handle.slice(0, 2).toUpperCase()
                  )}
                </button>
              </>
            ) : (
              <button
                className="text-button login"
                onClick={() => setAuthMode("login")}
              >
                Se connecter <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="main-shell">
        {(error || notice) && (
          <div
            className={`feedback ${error ? "error" : ""}`}
            role={error ? "alert" : "status"}
          >
            <span>{error || notice}</span>
            {error && (
              <button
                className="text-button"
                onClick={() =>
                  void refresh()
                    .then(() => setError(""))
                    .catch((e) => setError(e.message))
                }
              >
                Réessayer
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Masquer le message"
              onClick={() => {
                setError("");
                setNotice("");
              }}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {tab === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="tiny-star">✳</span> UN PEU DE POUSSIÈRE,
                  BEAUCOUP DE SOUVENIRS
                </span>
                <h1>
                  Il était une fois,
                  <br />
                  <em>ta chambre.</em>
                </h1>
                <p className="hero-description">
                  Chaque jour, ouvre un carton de ton enfance
                  <br className="desktop-only" /> et reconstruis la chambre de
                  tes rêves.
                </p>
                <p className="hero-sub">
                  Les billes dans la poche. La musique dans les oreilles.
                  <br className="desktop-only" /> Et tous ces petits trésors
                  qu’on n’a jamais vraiment oubliés.
                </p>
                <div className="hero-cta">
                  <button
                    className="button primary"
                    onClick={open}
                    disabled={
                      busy ||
                      !loaded ||
                      (!!state && state.player.stock === 0 && remaining > 0)
                    }
                  >
                    {busy
                      ? "Le carton s’ouvre…"
                      : state
                        ? "Ouvrir un carton"
                        : "Ouvrir mon premier carton"}
                    <ArrowRight size={18} />
                  </button>
                  <button className="text-button" onClick={() => setDemo(true)}>
                    Découvrir une chambre <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="quiet-note">
                  <ShieldCheck size={15} />
                  <span>
                    Sans paiement. Sans pression. Juste pour le plaisir.
                  </span>
                </div>
              </div>
              <div className="hero-room">
                <div className="room-note">
                  un petit coin de toi <span>↘</span>
                </div>
                <RoomScene
                  room={demoRoom}
                  items={demoItems}
                  definitions={catalogue}
                  rewards={["quotidien"]}
                  demo
                />
                <div className="demo-caption">
                  <span className="dot" /> Chambre de démonstration{" "}
                  <span>Une infinité de souvenirs à y ranger.</span>
                </div>
                <div className="floating-sticker">
                  <Heart size={15} /> À garder pour toujours
                </div>
              </div>
            </section>
            <section className="box-banner">
              <div className="box-art">
                <Cardboard opening={busy} />
              </div>
              <div className="box-copy">
                <span className="eyebrow">
                  {state
                    ? "VOTRE PROCHAINE TROUVAILLE"
                    : "VOTRE HISTOIRE COMMENCE ICI"}
                </span>
                <h2>
                  {state
                    ? `${state.player.stock} carton${state.player.stock > 1 ? "s" : ""} vous attend${state.player.stock > 1 ? "ent" : ""}.`
                    : "Un carton. Trois petits bonheurs."}
                </h2>
                <p>
                  {state
                    ? "Ouvrez, découvrez… et faites un peu de place sur l’étagère."
                    : "Votre premier carton est offert. Qu’est-ce qui se cache à l’intérieur ?"}
                </p>
                <div className="box-details">
                  <span>
                    <Box size={14} /> 3 objets par carton
                  </span>
                  <span>
                    <Clock3 size={14} />{" "}
                    {state
                      ? `Prochain : ${timer}`
                      : "Un carton toutes les 6 heures"}
                  </span>
                </div>
              </div>
              <div className="box-action">
                <button
                  className="button dark"
                  onClick={open}
                  disabled={
                    busy ||
                    !loaded ||
                    (!!state && state.player.stock === 0 && remaining > 0)
                  }
                >
                  {busy
                    ? "Ouverture…"
                    : state?.player.stock === 0 && remaining > 0
                      ? "Les souvenirs prennent leur temps"
                      : "Soulever le couvercle"}
                  <ArrowRight size={17} />
                </button>
                <Link href="/regles">Comment ça marche ?</Link>
              </div>
            </section>
            <section className="memories-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    ON PARIE QUE VOUS VOUS SOUVENEZ ?
                  </span>
                  <h2>Petits objets, grandes histoires.</h2>
                </div>
                <span className="handwritten">
                  La nostalgie n’a pas pris une ride.
                </span>
              </div>
              <div className="memory-cards">
                {[
                  {
                    id: "portable",
                    label: "Encore une partie",
                    years: "ANNÉES 2000",
                    text: "« J’arrête à la prochaine sauvegarde. »",
                  },
                  {
                    id: "baladeur",
                    label: "La bande-son de ta vie",
                    years: "ANNÉES 1990",
                    text: "La face B avait aussi ses pépites.",
                  },
                  {
                    id: "lampe",
                    label: "L’ambiance était parfaite",
                    years: "ANNÉES 2000",
                    text: "Des bulles, des posters, et ton univers.",
                  },
                ].map((x, i) => (
                  <article className={`memory-card memory-${i}`} key={x.id}>
                    <div>
                      <span className="eyebrow">{x.years}</span>
                      <h3>{x.label}</h3>
                      <p>{x.text}</p>
                    </div>
                    <img
                      src={`/objects/${x.id}.svg`}
                      alt={catalogue.find((d) => d.id === x.id)!.name}
                      width="140"
                      height="140"
                    />
                  </article>
                ))}
              </div>
            </section>
            {state?.openings.length ? (
              <section className="history">
                <div className="section-heading">
                  <h2>Les cartons déjà ouverts</h2>
                  <span>Vos découvertes sont bien rangées.</span>
                </div>
                <div className="history-list">
                  {state.openings.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOpening({ ...o, replayed: true })}
                    >
                      <Box size={21} />
                      <span>
                        {new Date(o.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="history-thumbnails">
                        {o.results.map((r) => (
                          <img
                            key={r.instanceId}
                            src={
                              state.definitions.find(
                                (d) => d.id === r.definitionId,
                              )?.illustration
                            }
                            alt=""
                            width="44"
                            height="44"
                          />
                        ))}
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            <div className="steps-strip">
              <span>
                <b>01</b> Ouvrir un carton
              </span>
              <ArrowRight size={18} />
              <span>
                <b>02</b> Retrouver des trésors
              </span>
              <ArrowRight size={18} />
              <span>
                <b>03</b> Se sentir chez soi
              </span>
            </div>
          </>
        )}
        {state && tab === "collection" && (
          <Collection
            state={state}
            refresh={refresh}
            onDecorate={() => setTab("room")}
            notify={notify}
            fail={setError}
          />
        )}
        {state && tab === "room" && (
          <RoomEditor
            state={state}
            refresh={refresh}
            notify={notify}
            fail={setError}
          />
        )}
        {state &&
          tab === "trades" &&
          (state.player.is_anonymous ? (
            <section className="empty-state">
              <Repeat2 size={44} />
              <h1>Les souvenirs, ça se partage.</h1>
              <p>
                Créez votre compte pour proposer des échanges avec d’autres
                collectionneurs.
                <br />
                Vos objets et votre chambre seront conservés.
              </p>
              <button
                className="button primary"
                onClick={() => setAuthMode("signup")}
              >
                Conserver mes souvenirs
              </button>
            </section>
          ) : (
            <Trades
              state={state}
              refresh={refresh}
              notify={notify}
              fail={setError}
            />
          ))}
        {state && tab === "profile" && (
          <Profile
            state={state}
            refresh={refresh}
            notify={notify}
            fail={setError}
            onSignup={() => setAuthMode("signup")}
            onLogout={signOut}
            onAdmin={() => setTab("admin")}
          />
        )}
        {state && tab === "admin" && state.player.role === "admin" && (
          <Admin notify={notify} fail={setError} refresh={refresh} />
        )}
      </main>
      <footer className="site-footer">
        <span className="footer-brand">le grenier.</span>
        <span>Les objets passent. Les souvenirs restent.</span>
        <div>
          <Link href="/regles">Règles du jeu</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <button
            className="text-button"
            onClick={() => setSound(!sound)}
            aria-pressed={sound}
          >
            {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}Son{" "}
            {sound ? "activé" : "désactivé"}
          </button>
        </div>
      </footer>
      {opening && state && (
        <OpeningDialog
          opening={opening}
          state={state}
          onClose={() => setOpening(null)}
          onRoom={() => {
            setOpening(null);
            setTab("room");
          }}
          onCollection={() => {
            setOpening(null);
            setTab("collection");
          }}
        />
      )}
      {authMode && (
        <Modal
          title={authMode === "signup" ? "Créer mon compte" : "Me connecter"}
          onClose={() => setAuthMode(null)}
        >
          <AuthForm
            mode={authMode}
            onMode={setAuthMode}
            onSuccess={async () => {
              await refresh();
              setAuthMode(null);
              notify(
                authMode === "signup"
                  ? "Votre compte est créé. Tous vos souvenirs sont conservés."
                  : "Vous avez retrouvé votre compte. Votre essai est resté séparé.",
              );
            }}
          />
        </Modal>
      )}
      {demo && (
        <Modal
          title="Chambre de démonstration"
          wide
          onClose={() => setDemo(false)}
        >
          <span className="eyebrow">UNE CHAMBRE POUR S’INSPIRER</span>
          <h2>Et si c’était la vôtre ?</h2>
          <p>Cette chambre est une démonstration, pas celle d’un joueur.</p>
          <RoomScene
            room={demoRoom}
            items={demoItems}
            definitions={catalogue}
            rewards={collections.map((c) => c.id)}
            demo
          />
          <button
            className="button primary"
            onClick={() => {
              setDemo(false);
              void open();
            }}
          >
            Ouvrir mon carton <ArrowRight size={17} />
          </button>
        </Modal>
      )}
    </>
  );
}
function OpeningDialog({
  opening,
  state,
  onClose,
  onRoom,
  onCollection,
}: {
  opening: Opening;
  state: GameState;
  onClose: () => void;
  onRoom: () => void;
  onCollection: () => void;
}) {
  const [revealed, setRevealed] = useState(opening.replayed ? 3 : 0);
  useEffect(() => {
    if (opening.replayed) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timers = [1, 2, 3].map((n) =>
      setTimeout(
        () => setRevealed((previous) => Math.max(previous, n)),
        reduce ? 0 : 500 + n * 600,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [opening.replayed]);
  return (
    <Modal title="Vos découvertes" wide onClose={onClose}>
      <div className="opening-heading">
        <span className="eyebrow">
          <Sparkles size={15} />{" "}
          {opening.replayed
            ? "LE SOUVENIR EST TOUJOURS LÀ"
            : "ÇA SENT BON LES SOUVENIRS"}
        </span>
        <h2>Regardez ce qu’on a retrouvé.</h2>
        <p>
          <Check size={14} /> Trois objets sauvegardés dans votre collection.
        </p>
      </div>
      <div className="reveal-grid">
        {opening.results.map((r, i) => {
          const d = state.definitions.find((d) => d.id === r.definitionId)!;
          return (
            <div
              className={`reveal-card ${d.rarity} ${revealed > i ? "revealed" : ""}`}
              key={r.instanceId}
            >
              <span className="discovery-label">
                {r.isNew ? "Nouvelle trouvaille" : "Doublon"}
              </span>
              <div className="reveal-art">
                {revealed > i ? (
                  <img
                    src={d.illustration}
                    alt={d.name}
                    width="180"
                    height="180"
                  />
                ) : (
                  <Cardboard opening />
                )}
              </div>
              <div
                className={
                  revealed > i ? "reveal-text" : "reveal-text concealed"
                }
              >
                <span className={`rarity ${d.rarity}`}>
                  {rarityLabels[d.rarity]}
                </span>
                <h3>{d.name}</h3>
                <p>Années {d.period}</p>
                <p className="anecdote">{d.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      {revealed < 3 ? (
        <div className="modal-actions">
          <button className="button primary" onClick={() => setRevealed(3)}>
            Tout révéler
          </button>
          <button className="text-button" onClick={() => setRevealed(3)}>
            Passer l’animation
          </button>
        </div>
      ) : (
        <div className="modal-actions">
          <button className="button primary" onClick={onRoom}>
            <House size={17} /> Décorer ma chambre
          </button>
          <button className="button secondary" onClick={onCollection}>
            Voir ma collection
          </button>
        </div>
      )}
    </Modal>
  );
}
