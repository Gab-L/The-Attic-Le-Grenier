import Link from "next/link";
import { pool } from "@/lib/db";
import { rarityLabels, rarities } from "@/lib/catalog";
import type { Distribution } from "@/lib/rules";
export const dynamic = "force-dynamic";
export default async function Rules() {
  const config: Distribution = (
    await pool.query("SELECT value FROM settings WHERE id='distribution'")
  ).rows[0].value;
  return (
    <main className="legal">
      <Link href="/" className="brand">
        le grenier.
      </Link>
      <span className="eyebrow">LE PLAISIR, TOUT SIMPLEMENT</span>
      <h1>Les règles du grenier.</h1>
      <p>
        Chaque carton contient trois exemplaires d’objets inspirés des années
        1990, 2000 et 2010. Tout se passe dans le jeu : aucun objet n’a de
        valeur financière.
      </p>
      <h2>Un carton, puis le temps fait son travail.</h2>
      <p>
        Votre visite commence avec un carton. Un nouveau carton arrive toutes
        les {config.rechargeHours} heures, jusqu’à quatre en réserve. La
        recharge continue pendant votre absence. Une fois la réserve pleine,
        aucun temps supplémentaire n’est accumulé. Après une ouverture depuis un
        stock plein, le délai repart de zéro.
      </p>
      <h2>Une surprise, avec des règles claires.</h2>
      <ul>
        {rarities.map((r) => (
          <li key={r}>
            {rarityLabels[r]} : {config[r]} % par objet tiré.
          </li>
        ))}
      </ul>
      <p>
        La rareté est tirée en premier, puis un objet est choisi uniformément
        parmi les objets actifs de cette rareté. Les doublons sont possibles, y
        compris dans un même carton. Aucun système de garantie, bonus de
        connexion ou série quotidienne cachée. Les paramètres ci-dessus sont
        ceux actuellement appliqués par le serveur.
      </p>
      <h2>Votre chambre, à votre rythme.</h2>
      <p>
        Les objets se posent sur des emplacements définis. Certains prennent
        deux places ou demandent une surface particulière. Retirer un objet le
        remet dans votre inventaire. Les sauvegardes sont automatiques. Un
        conflit entre deux onglets demande de recharger la chambre, sans
        écrasement silencieux.
      </p>
      <h2>Des collections à compléter.</h2>
      <p>
        Découvrez les six objets d’une collection pour débloquer sa décoration
        fixe, automatiquement affichée dans la chambre. Les découvertes,
        décorations et badges sont conservés après un échange. Posséder
        plusieurs fois le même objet ne fait pas avancer la complétion.
      </p>
      <h2>Échanger en confiance.</h2>
      <p>
        Les échanges sont réservés aux comptes inscrits. Une proposition peut
        contenir un à six exemplaires de chaque côté et expire au bout de 72
        heures. Les objets de l’expéditeur sont réservés ; ceux du destinataire
        restent disponibles jusqu’à son acceptation. Un objet placé ou déjà
        réservé ne peut pas être engagé. Aucun transfert partiel : si un objet
        manque, l’échange échoue et les inventaires restent inchangés.
      </p>
      <p>
        Le destinataire peut accepter ou refuser ; l’expéditeur peut annuler.
        Les réservations sont libérées lors de l’annulation, du refus ou de
        l’expiration. Le blocage d’un joueur annule les propositions en attente
        entre vous. Les signalements sont consultables par l’administration.
      </p>
      <h2>Invité ou compte ?</h2>
      <p>
        La visite invitée est enregistrée sur le serveur, avec une session dans
        votre navigateur. Créer un nouveau compte depuis cette visite conserve
        vos objets, votre chambre et votre stock, sans deuxième récompense. Vous
        connecter à un compte déjà existant conserve sa progression ; votre
        essai reste séparé. Gardez votre mot de passe en lieu sûr : la
        récupération par email exige un service d’envoi configuré.
      </p>
      <h2>Le partage reste votre choix.</h2>
      <p>
        Une chambre est privée par défaut. Vous pouvez la rendre publique depuis
        votre profil et retirer cette autorisation à tout moment. Rien n’est
        publié automatiquement sur un réseau social. Les chambres de
        démonstration sont explicitement identifiées.
      </p>
      <Link className="button primary" href="/">
        Retour au grenier
      </Link>
    </main>
  );
}
