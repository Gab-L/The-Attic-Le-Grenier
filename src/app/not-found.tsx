import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>Cette porte est fermée.</h1>
      <p>La page n’existe pas ou cette chambre est privée.</p>
      <Link href="/" className="button primary">
        Retour au grenier
      </Link>
    </main>
  );
}
