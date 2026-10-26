# Le Grenier

**Chaque jour, ouvre un carton de ton enfance et reconstruis la chambre de tes rêves.**

Jeu web en français, jouable et sauvegardé dans PostgreSQL. Interface responsive, 36 illustrations SVG originales et chambre 2D. Aucun paiement ni service payant nécessaire pour jouer localement.

[Aperçu de l’accueil](docs/previews/accueil-desktop.png) · [Mobile](docs/previews/accueil-mobile.png) · [Ouverture](docs/previews/ouverture.png) · [Chambre](docs/previews/chambre.png)

## Ouvrir le site avec Vercel

**[Configurer Le Grenier dans Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FGab-L%2FThe-Attic-Le-Grenier%2Ftree%2Fcodex%2Fle-grenier-vercel&project-name=le-grenier&repository-name=le-grenier&env=BETTER_AUTH_SECRET&envDescription=Cr%C3%A9ez%20un%20secret%20al%C3%A9atoire%20priv%C3%A9%20d%E2%80%99au%20moins%2032%20caract%C3%A8res%20et%20conservez-le%20dans%20Vercel.&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)** : connecter votre compte GitHub, ajouter une base Neon/PostgreSQL et renseigner le secret privé demandé, puis cliquer sur **Deploy**. Vercel fournit l’adresse du site en `.vercel.app`, sans rien installer sur votre ordinateur.

Le projet est configuré pour ce déploiement. [Guide pas à pas et dépannage](docs/MISE-EN-LIGNE.md).

## Lancer le jeu

Prérequis : **Node.js 22 ou plus**, npm, Docker avec Compose. Depuis la racine du dépôt :

```bash
npm ci
npm run setup
npm run dev
```

Le serveur écoute sur le **port 3000**. `setup` crée `.env` sans écraser ses valeurs, génère un secret d’authentification privé, démarre PostgreSQL, applique les migrations puis installe le catalogue. Il peut être relancé. Le seed ne réinitialise ni les joueurs ni les modifications administratives.

Dans le cloud actuel, si le cache npm par défaut n’est pas accessible : `npm ci --cache /tmp/grenier-npm`.

Si PostgreSQL tourne déjà sans Docker : renseigner `DATABASE_URL` dans `.env`, puis exécuter `node scripts/setup-local.mjs`, `npm run db:migrate`, `npm run db:seed` et `npm run dev`.

La base locale est persistée dans le volume Docker `grenier-db`. `docker compose stop` arrête les services sans effacer les données. Ne pas utiliser `docker compose down -v` pour un simple redémarrage : cette commande supprimerait le volume.

## Essayer la boucle complète

1. Cliquer sur **Ouvrir mon premier carton**. Une vraie session invitée est créée sur le serveur, sans formulaire.
2. Découvrir les trois objets. L’ouverture est déjà enregistrée ; recharger ou fermer l’animation ne fait rien perdre. Les dix dernières ouvertures sont consultables dans Mon grenier.
3. Choisir **Décorer ma chambre**, sélectionner un exemplaire puis un emplacement pointillé compatible. Le clavier et le glisser-déposer sont également pris en charge. Les changements se sauvegardent automatiquement.
4. Consulter Collection : recherche, périodes, raretés, séries, favoris, doublons et silhouettes des objets manquants.
5. Dans Profil, **Conserver ma progression** crée un compte avec les mêmes objets, la même chambre et le même stock. Se connecter à un compte existant reprend ce compte et laisse l’essai séparé.
6. Activer volontairement la publication de la chambre. Tester le lien dans un navigateur privé, puis revenir en privé pour révoquer l’accès. L’export PNG fonctionne sans publier la chambre.
7. Pour les échanges, créer un autre compte dans un second profil de navigateur. Chaque compte peut ouvrir son premier carton. Rechercher le pseudo de l’autre dans Échanges, sélectionner un à six exemplaires de chaque côté, envoyer puis accepter depuis le destinataire. Retirer les objets de la chambre avant de les échanger.

Le premier carton est immédiat ; les suivants arrivent toutes les six heures jusqu’à quatre en réserve. Trois objets par carton ; raretés 65/23/10/2 %. Ces paramètres sont vérifiés et configurables côté serveur. Les règles affichées lisent les paramètres réellement actifs.

## Fonctionnalités livrées

- Tirages serveur avec `crypto.randomInt`, ouverture atomique/idempotente, protection du dernier carton contre les doubles requêtes et recharge UTC.
- 36 objets : 18 courants, 10 peu courants, 6 rares, 2 légendaires ; six collections avec six décorations exclusives et cinq badges.
- Exemplaires individuels, catalogue filtrable, favoris, doublons, historique de découverte conservé après échange.
- Chambre en coordonnées logiques, empreintes et surfaces validées, trois ambiances, murs/sols personnalisables, versions contre les conflits d’onglets et export PNG.
- Better Auth pour sessions invitées et comptes email/mot de passe, pseudo unique, conservation fiable de l’essai à l’inscription.
- Publication volontaire, révocable et sans inventaire privé ni email ; métadonnées Open Graph et partage natif/copie de lien.
- Échanges réservés et transactionnels, acceptation idempotente, refus, annulation, expiration à 72 h sans cron obligatoire, blocage, signalement et notifications internes.
- Administration autorisée côté serveur : définitions existantes, archivage, distribution, délais, signalements, journaux d’ouvertures/d’échanges et audit.
- Règles et confidentialité adaptées à cette version ; animations réduites, son facultatif désactivé par défaut et assets locaux.

## Administration

Créer un compte normal et accéder au jeu une fois, puis depuis un terminal **autorisé à accéder à la base** :

```bash
npm run admin -- mon_pseudo
# Pour retirer le rôle :
npm run admin -- mon_pseudo --revoke
```

Recharger le profil pour voir le bouton Administration. L’attribution est auditée, interdite aux invités et impossible depuis le navigateur. Aucun compte ou mot de passe administrateur n’est fourni.

## Vérifications

```bash
npm run typecheck
npm run lint
npm test
npm run build

# Navigateur Playwright (machine habituelle) :
npx playwright install chromium
npm run test:e2e

# Dans cet environnement cloud, Chromium est déjà installé :
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

`npm test` utilise et réinitialise exclusivement **grenier_test**. Les tests navigateur créent/réinitialisent **grenier_e2e**, lancent leur serveur sur le **port 3100**, puis l’arrêtent. Le rôle PostgreSQL de test doit pouvoir créer ces bases. Aucun nettoyage de la base de développement `grenier` n’est effectué par ces commandes. Ne pointer aucune application réelle vers les bases réservées aux tests.

Les tests couvrent recharge/plafond, distribution et catalogue actif, idempotence et concurrence, propriété et versions de chambre, confidentialité, réservations, acceptation concurrente, annulation, refus, expiration, indisponibilité d’un objet, blocage, récompenses et droits administrateur. Les parcours Chromium couvrent invité → carton → placement → inscription → rechargement → publication → visite externe → révocation, ainsi qu’un échange via l’interface et une connexion à un compte existant. Vérification des quatre vues à 360 px et sur desktop ; captures dans `test-results`.

## Variables et secrets

Voir `.env.example`, sans secret d’authentification réel. `.env` est ignoré par Git.

| Variable             | Usage                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Connexion PostgreSQL côté serveur ; `POSTGRES_URL` accepté si absent                          |
| `BETTER_AUTH_URL`    | Origine du site ; détectée automatiquement sur Vercel, configurable pour un domaine personnel |
| `BETTER_AUTH_SECRET` | Secret privé aléatoire stable ; généré localement par `setup`                                 |
| `SMTP_URL`           | Facultatif, transport Nodemailer pour la récupération de compte                               |
| `MAIL_FROM`          | Facultatif, adresse d’expédition autorisée par le transport SMTP                              |
| `POSTGRES_PASSWORD`  | Mot de passe de l’image Docker ; si changé, adapter également `DATABASE_URL`                  |

Sans SMTP, la récupération de mot de passe est explicitement indiquée indisponible. Aucune clé d’API n’est nécessaire pour la boucle principale. Les valeurs sensibles ne vont jamais dans une variable `NEXT_PUBLIC_*`. Hors Vercel, configurer l’origine et le proxy avant de servir le jeu sur une autre adresse.

## Déployer sur un serveur Node.js

Pour Vercel, suivre le [guide dédié](docs/MISE-EN-LIGNE.md). Les étapes ci-dessous concernent un serveur Node.js classique.

1. Fournir Node.js compatible, une base PostgreSQL sauvegardée et une terminaison HTTPS.
2. Définir les variables serveur avec de nouveaux identifiants de production et un secret d’authentification fort. Ne pas utiliser le mot de passe de développement de Compose.
3. Exécuter `npm ci`, `npm run db:migrate`, `npm run db:seed`, `npm run build`, puis `npm start`. Pour les migrations, fournir un `.env` privé ou adapter l’invocation `tsx` aux variables injectées par l’hébergeur.
4. Vérifier `GET /api/health` (200 et `{"status":"ok"}`), puis le parcours de jeu. Le serveur de production utilise le port 3000 par défaut.
5. Configurer le proxy pour ne pas mettre en cache les API et chambres, et pour transmettre des informations d’origine/client fiables. Préparer SMTP si la récupération de compte est nécessaire.
6. Prévoir sauvegardes PostgreSQL et restauration vérifiée, surveillance, purge des anciennes sessions/invités/compteurs, contact de l’éditeur et procédure de traitement des demandes et signalements.

Le volume Docker n’est pas présumé inclus dans un instantané Codex. Pour une sauvegarde locale : `docker compose exec -T db pg_dump -U grenier -d grenier > sauvegarde.sql` ; stocker ce fichier hors Git et dans un emplacement privé. Tester la restauration sur une base distincte avant d’utiliser cette procédure pour une reprise.

## Structure et limites

`src/lib/game.ts` centralise les transactions ; `rules.ts` contient les règles pures ; `auth.ts` configure Better Auth ; `migrations` contient le schéma SQL versionné ; `src/components` porte le jeu ; `scripts/generate-assets.mjs` conserve les dessins originaux et leur manifest.

Voir [ARCHITECTURE.md](docs/ARCHITECTURE.md) pour les choix et limites, et [PROGRESS.md](PROGRESS.md) pour l’état vérifié, y compris le déploiement Vercel. Le verrou global du jeu privilégie la cohérence de cette V1 ; un fort trafic demandera une stratégie de verrouillage plus fine. Aucun serveur SMTP ni parcours sur Safari/Firefox/appareil tactile physique n’a été validé ici. Les informations légales et procédures de suppression/export de compte restent à compléter avant une exploitation publique.
