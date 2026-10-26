import Link from "next/link";
export default function Privacy() {
  return (
    <main className="legal">
      <Link className="brand" href="/">
        le grenier.
      </Link>
      <h1>Vos souvenirs vous appartiennent.</h1>
      <p>
        Cette page décrit les fonctions de cette première version. Elle n’est
        pas une certification de conformité juridique. L’identité et les
        coordonnées de l’éditeur, l’hébergeur, la base légale et les durées de
        conservation doivent être complétés avant une ouverture au public.
      </p>
      <h2>Ce qui est enregistré</h2>
      <p>
        Le serveur conserve votre session, votre pseudo, votre email privé si
        vous créez un compte, un dérivé sécurisé de votre mot de passe géré par
        Better Auth, vos exemplaires, ouvertures, placements, favoris,
        découvertes et paramètres de chambre. Il conserve aussi les propositions
        d’échanges, notifications, blocages et signalements nécessaires au
        fonctionnement du jeu.
      </p>
      <p>
        Les sessions peuvent contenir des informations techniques telles que
        l’adresse IP et le navigateur. Des compteurs de fréquence limitent les
        abus. Les actions administratives sont journalisées. La prévention des
        comptes multiples n’est pas parfaite.
      </p>
      <h2>Cookies et stockage du navigateur</h2>
      <p>
        Des cookies de session essentiels permettent de vous reconnaître. La
        progression réside dans PostgreSQL, pas dans le stockage du navigateur.
        Une clé technique d’ouverture peut être conservée dans sessionStorage
        afin de reprendre une requête interrompue sans dépenser un nouveau
        carton. Aucun outil publicitaire ou analytique tiers n’est intégré.
      </p>
      <h2>Ce qui peut être public</h2>
      <p>
        Uniquement si vous publiez votre chambre : votre pseudo, votre date
        d’arrivée, vos badges et les objets exposés. Votre email, le reste de
        votre inventaire et les données d’authentification ne sont jamais inclus
        dans cette page. Vous pouvez repasser la chambre en privé. Une capture
        d’écran déjà téléchargée ou partagée ne peut pas être révoquée.
      </p>
      <p>
        Pour les échanges, les comptes inscrits peuvent rechercher un pseudo et
        consulter ses exemplaires disponibles pour un échange. Les comptes
        bloqués ne peuvent plus se contacter dans ce flux. Les administrateurs
        peuvent consulter les journaux d’ouvertures, d’échanges et les
        signalements pour résoudre un incident.
      </p>
      <h2>Emails et droits</h2>
      <p>
        Aucun email de notification automatique n’est envoyé. Si l’éditeur
        configure SMTP, un email est envoyé à votre demande pour récupérer votre
        compte. Un formulaire automatique de suppression ou d’export de compte
        n’est pas encore livré ; avant publication, l’éditeur doit définir et
        afficher un contact ainsi qu’une procédure d’accès, d’export et de
        suppression des données.
      </p>
      <p className="note">
        À compléter avant toute exploitation publique : identité et contact de
        l’éditeur, hébergeur, politique de conservation, traitement des comptes
        invités abandonnés et procédure de traitement des demandes et
        signalements.
      </p>
      <Link href="/" className="button primary">
        Retour au grenier
      </Link>
    </main>
  );
}
