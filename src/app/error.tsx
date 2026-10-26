"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-state">
      <h1>Un peu de poussière dans les rouages.</h1>
      <p>La page n’a pas pu se charger. Vos objets restent enregistrés.</p>
      <button className="button primary" onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
