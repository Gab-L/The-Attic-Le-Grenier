"use client";
import { useEffect, useState } from "react";
import {
  Box,
  UserRound,
  Shield,
  Share2,
  LockKeyhole,
  Award,
  Bell,
  LogOut,
  ArrowRight,
  Check,
  Settings2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { api, shareLink } from "@/lib/client";
import { badgeLabels } from "@/lib/catalog";
import type { GameState } from "@/lib/game";
export function AuthForm({
  mode,
  onMode,
  onSuccess,
}: {
  mode: "signup" | "login";
  onMode: (m: "signup" | "login") => void;
  onSuccess: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [reset, setReset] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    api<{ recoveryEnabled: boolean }>("config")
      .then((d) => setRecovery(d.recoveryEnabled))
      .catch(() => {});
  }, []);
  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      let result;
      if (reset) {
        result = await authClient.requestPasswordReset({
          email,
          redirectTo: "/nouveau-mot-de-passe",
        });
        if (!result.error) setSent(true);
      } else if (mode === "signup") {
        const handle = String(form.get("username")).toLowerCase();
        result = await authClient.signUp.email({
          email,
          password,
          username: handle,
          name: handle,
        });
      } else result = await authClient.signIn.email({ email, password });
      if (result.error) {
        const code = result.error.code || "";
        throw new Error(
          code.includes("EXIST") || code.includes("TAKEN")
            ? "Cet email ou ce pseudo est déjà utilisé. Connectez-vous ou choisissez un autre pseudo."
            : code.includes("RATE")
              ? "Trop de tentatives. Réessayez dans une minute."
              : code.includes("PASSWORD") || code.includes("CREDENTIAL")
                ? "Vérifiez votre email et votre mot de passe (10 caractères minimum)."
                : "Impossible de continuer. Vérifiez les champs et réessayez.",
        );
      }
      if (!reset) await onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-sheet">
      <span className="auth-mark">
        <Box size={30} />
      </span>
      <span className="eyebrow">BIENVENUE CHEZ VOUS</span>
      <h2>
        {reset
          ? "Retrouver la clé."
          : mode === "signup"
            ? "Gardez vos souvenirs."
            : "Votre grenier vous attend."}
      </h2>
      <p>
        {reset
          ? "Recevez un lien pour choisir un nouveau mot de passe."
          : mode === "signup"
            ? "Votre collection, votre chambre et vos trouvailles restent exactement comme vous les avez laissées."
            : "Vous retrouverez la progression de votre compte. Si vous avez commencé un essai invité, il restera séparé et ne remplacera rien."}
      </p>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      {sent ? (
        <p className="feedback" role="status">
          Si cet email correspond à un compte, un lien de récupération a été
          envoyé.
        </p>
      ) : (
        <form action={submit}>
          {mode === "signup" && !reset && (
            <label>
              Votre pseudo
              <input
                name="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_.]+"
                autoComplete="username"
                placeholder="poussiere.detoiles"
              />
              <small>
                3 à 24 caractères : lettres, chiffres, points et tirets bas. Le
                pseudo sera public et permanent.
              </small>
            </label>
          )}
          <label>
            Votre email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="vous@exemple.fr"
            />
            <small>Il reste privé.</small>
          </label>
          {!reset && (
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                minLength={10}
                maxLength={128}
                required
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder="Au moins 10 caractères"
              />
            </label>
          )}
          <button className="button primary full" disabled={busy}>
            {busy
              ? "Un petit instant…"
              : reset
                ? "Recevoir mon lien"
                : mode === "signup"
                  ? "Créer mon compte et tout conserver"
                  : "Me connecter"}
            <ArrowRight size={17} />
          </button>
        </form>
      )}
      <div className="auth-bottom">
        {reset ? (
          <button
            className="text-button"
            onClick={() => {
              setReset(false);
              setSent(false);
            }}
          >
            Revenir à la connexion
          </button>
        ) : (
          <>
            <button
              className="text-button"
              onClick={() => {
                setError("");
                onMode(mode === "signup" ? "login" : "signup");
              }}
            >
              {mode === "signup" ? "J’ai déjà un compte" : "Créer un compte"}
            </button>
            {mode === "login" &&
              (recovery ? (
                <button className="text-button" onClick={() => setReset(true)}>
                  Mot de passe oublié ?
                </button>
              ) : (
                <small>
                  Récupération par email indisponible : aucun service d’envoi
                  n’est configuré.
                </small>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
export function Profile({
  state,
  refresh,
  notify,
  fail,
  onSignup,
  onLogout,
  onAdmin,
}: {
  state: GameState;
  refresh: () => Promise<unknown>;
  notify: (s: string) => void;
  fail: (s: string) => void;
  onSignup: () => void;
  onLogout: () => void;
  onAdmin: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [pendingPublic, setPendingPublic] = useState<boolean | null>(null);
  async function publish(value: boolean) {
    setBusy(true);
    setPendingPublic(value);
    try {
      await api("profile", { public: value });
      await refresh();
      notify(
        value
          ? "Votre chambre est publique. Vous pouvez partager son lien."
          : "Votre chambre est privée. L’ancien lien ne permet plus de la consulter.",
      );
    } catch (e) {
      fail((e as Error).message);
    } finally {
      setBusy(false);
      setPendingPublic(null);
    }
  }
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            LE COLLECTIONNEUR DERRIÈRE LES TRÉSORS
          </span>
          <h1>
            Mon petit univers<span className="title-dot">.</span>
          </h1>
        </div>
        <button className="button secondary" onClick={onLogout}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
      <div className="profile-grid">
        <div className="panel profile-card">
          <div className="large-avatar">
            <UserRound size={36} />
          </div>
          <h2>
            {state.player.is_anonymous
              ? "Explorateur du grenier"
              : state.player.handle}
          </h2>
          <p>
            Arrivé le{" "}
            {new Date(state.player.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="profile-stats">
            <div>
              <b>{state.player.discoveries.length}</b>
              <span>souvenirs découverts</span>
            </div>
            <div>
              <b>{state.player.rewards.length}</b>
              <span>collections complètes</span>
            </div>
            <div>
              <b>{state.player.room.placements.length}</b>
              <span>objets exposés</span>
            </div>
          </div>
          {state.player.is_anonymous && (
            <div className="guest-banner">
              <h3>Ces souvenirs méritent de rester.</h3>
              <p>
                Créez un compte pour retrouver votre grenier sur un autre
                appareil et échanger vos doublons. Sans compte, l’accès dépend
                de cette session de navigateur.
              </p>
              <button className="button primary" onClick={onSignup}>
                Conserver ma progression <ArrowRight size={16} />
              </button>
            </div>
          )}
          {state.player.role === "admin" && (
            <button className="button secondary" onClick={onAdmin}>
              <Settings2 size={16} />
              Administration
            </button>
          )}
        </div>
        <div>
          <section className="panel">
            <h2>
              <Share2 size={21} /> Une porte ouverte, si vous le voulez.
            </h2>
            <p>
              Seuls votre pseudo, votre date d’arrivée, vos badges et les objets
              exposés seront visibles. Votre email et le reste de votre
              inventaire restent privés.
            </p>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={pendingPublic ?? state.player.public}
                disabled={busy}
                onChange={(e) => publish(e.target.checked)}
              />
              <span>
                {state.player.public
                  ? "Ma chambre est publique"
                  : "Ma chambre est privée"}
              </span>
              {state.player.public ? (
                <Share2 size={18} />
              ) : (
                <LockKeyhole size={18} />
              )}
            </label>
            {state.player.public && (
              <div className="share-controls">
                <a
                  href={`/chambre/${state.player.share_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-button"
                >
                  Voir ma page publique ↗
                </a>
                <button
                  className="button primary"
                  onClick={() =>
                    shareLink(
                      `${location.origin}/chambre/${state.player.share_id}`,
                    )
                      .then(notify)
                      .catch((e) => fail(e.message))
                  }
                >
                  Partager le lien
                </button>
              </div>
            )}
          </section>
          <section className="panel">
            <h2>
              <Award size={21} /> Petites fiertés
            </h2>
            <div className="badge-list">
              {Object.entries(badgeLabels).map(([id, label]) => (
                <div
                  key={id}
                  className={`badge ${state.player.badges.includes(id) ? "earned" : ""}`}
                >
                  <Award size={24} />
                  <span>{label}</span>
                  <small>
                    {state.player.badges.includes(id)
                      ? "Débloqué"
                      : {
                          first: "Ouvrir un carton",
                          decorator: "Placer cinq objets",
                          collection: "Compléter une collection",
                          ten: "Découvrir dix objets",
                          twenty: "Découvrir vingt objets",
                        }[id]}
                  </small>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>
                <Bell size={21} /> Les nouvelles du grenier
              </h2>
              {state.notifications.some((n) => !n.read) && (
                <button
                  className="text-button"
                  onClick={() =>
                    api("profile", { readNotifications: true })
                      .then(refresh)
                      .catch((e) => fail(e.message))
                  }
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            {state.notifications.length ? (
              state.notifications.map((n) => (
                <p
                  key={n.id}
                  className={`notification ${!n.read ? "unread" : ""}`}
                >
                  <Check size={15} />
                  {n.message}
                </p>
              ))
            ) : (
              <p className="muted">
                Vos propositions et réponses aux échanges apparaîtront ici.
              </p>
            )}
          </section>
        </div>
      </div>
      <p className="quiet-note">
        <Shield size={15} /> Aucun paiement, aucune valeur financière et aucune
        publication automatique.
      </p>
    </section>
  );
}
