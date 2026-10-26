"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
export default function Reset() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="legal">
      <Link href="/" className="brand">
        le grenier.
      </Link>
      <h1>Une nouvelle clé.</h1>
      <p>Choisissez un nouveau mot de passe pour retrouver vos souvenirs.</p>
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      <form
        action={async (form) => {
          setBusy(true);
          try {
            const token = new URLSearchParams(location.search).get("token");
            if (!token)
              throw new Error(
                "Lien invalide. Demandez un nouvel email de récupération.",
              );
            const result = await authClient.resetPassword({
              token,
              newPassword: String(form.get("password")),
            });
            if (result.error)
              throw new Error(
                "Le lien a expiré ou est invalide. Demandez un nouvel email.",
              );
            setMessage("Mot de passe mis à jour. Vous pouvez vous connecter.");
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nouveau mot de passe
          <input
            type="password"
            name="password"
            minLength={10}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </label>
        <button className="button primary" disabled={busy}>
          Enregistrer le mot de passe
        </button>
      </form>
      <Link className="button secondary" href="/">
        Retour à la connexion
      </Link>
    </main>
  );
}
