# Architecture et décisions

## Stack

Next.js 16.4.3 / React 19.3.1, TypeScript strict, PostgreSQL 17, Drizzle 0.45.4 et Better Auth 1.7.13. Versions exactes dans `package.json` et dépendances transitives verrouillées dans `package-lock.json`. CSS dédié plutôt que Tailwind : la stack proposée était indicative, et la direction artistique n’exige pas de framework CSS.

La documentation officielle Next.js est livrée dans `node_modules/next/dist/docs`. Les guides route handlers, composants serveur/client et métadonnées ont été consultés. La documentation officielle du plugin Anonymous de Better Auth a été consultée via son dépôt GitHub ; les signatures ont été vérifiées dans la version installée. Drizzle gère l’adaptateur d’authentification ; les règles du jeu utilisent des requêtes PostgreSQL paramétrées explicites pour rendre les transactions et verrouillages auditables.

## Source de vérité

PostgreSQL conserve toute progression. `sessionStorage` ne contient qu’une clé d’idempotence en cas d’ouverture interrompue ; aucun inventaire ni tirage n’est décidé par le navigateur. Les sessions sont gérées par Better Auth, avec cookies HttpOnly et configuration Secure automatique en HTTPS. Les mots de passe sont traités par Better Auth, sans cryptographie d’authentification maison.

Le modèle inclut les utilisateurs/sessions/comptes/vérifications, joueurs/profils, définitions, exemplaires, collections, ouvertures, échanges et réservations, notifications, blocages, signalements, paramètres et audit. Chambre, favoris, découvertes, badges et décorations sont des documents JSONB du joueur. Les tables relationnelles portent les contraintes d’unicité et références ; le document de chambre est validé contre les exemplaires et le catalogue dans la transaction.

## Transactions et concurrence

La V1 acquiert un verrou transactionnel PostgreSQL commun aux opérations de jeu. C’est un choix simple, sûr entre processus et adapté à un petit lancement : pas une architecture destinée à un fort débit. Toutes les opérations de mutation et de lecture cohérente utilisent ce verrou. Une évolution pourra employer des verrous ordonnés par joueur/échange après mesures et tests de charge.

Les ouvertures débitent le stock et attribuent trois UUID d’exemplaires dans la même transaction. La paire `(player_id, idempotency_key)` est unique. La répétition renvoie les mêmes résultats et leurs badges Nouveau/Doublon originaux. Le hasard provient de `crypto.randomInt`, avec tirages indépendants ; le catalogue actif et les poids sont lus côté serveur. Les dates persistées sont UTC. L’horloge locale du navigateur n’intervient pas dans la recharge et son compte à rebours s’appuie sur l’heure serveur et `performance.now()`.

La recharge est une fonction pure : une réserve pleine remet l’ancre à l’heure courante ; ouvrir depuis une réserve pleine fait repartir un intervalle entier. Un changement administratif de délai conserve la fraction de recharge déjà effectuée.

Un échange réserve les exemplaires de l’expéditeur. À l’acceptation, propriété, placement et réservations des deux parties sont revérifiés, puis tous les propriétaires changent ensemble. Les échanges expirés sont nettoyés au début des opérations de jeu, avec l’heure réelle de PostgreSQL après acquisition du verrou. Un savepoint permet d’annuler une action invalide tout en validant le nettoyage des expirations et le compteur global de requêtes. Aucun cron n’est indispensable.

Chaque sauvegarde de chambre porte une version. En cas de conflit, le serveur renvoie 409 ; l’interface recharge la version courante et explique que le placement doit être recommencé. Un échec réseau propose une nouvelle tentative. Le placement utilise des identifiants d’emplacement stables, pas des pixels d’écran.

## Authentification invitée et comptes

Une session invitée est un véritable utilisateur Better Auth. Son premier accès au jeu crée exactement un joueur et un carton. Lors d’une **nouvelle inscription**, le hook Anonymous réaffecte le même joueur au nouvel utilisateur : les UUID des exemplaires, le stock et la chambre restent identiques. Les anciennes sessions invitées sont invalidées pour éviter de recréer un premier carton avec l’ancien cookie.

Lors d’une **connexion à un compte existant**, aucune fusion n’a lieu. Le compte reprend sa progression ; l’essai reste une identité indépendante. L’interface décrit explicitement ce comportement. Le pseudo unique est normalisé en minuscules et permanent dans cette V1.

La récupération de compte utilise la fonction Better Auth prévue à cet effet et Nodemailer si `SMTP_URL` et `MAIL_FROM` sont configurés. Sans transport, l’interface indique son indisponibilité. Aucun mot de passe administrateur prédéfini ; le rôle est attribué seulement par une commande serveur disposant des droits sur la base.

## Progression et vie privée

Les découvertes sont historiques : un échange ne fait pas perdre la progression d’une collection. Compléter six définitions donne une décoration fixe une seule fois ; elle ne rejoint ni l’inventaire échangeable ni les tirages. Les badges restent acquis. Les six décorations apparaissent automatiquement dans la chambre.

Les chambres sont privées par défaut. Leur route publique vérifie le drapeau à chaque requête ; aucune page privée n’est mise en cache publiquement. Le DTO public ne contient que pseudo, date, badges, chambre, décorations et définitions/exemplaires **exposés**. Les emails et objets non exposés en sont absents. Les captures déjà téléchargées ne sont évidemment pas révocables.

Pour rechercher un échange, un compte inscrit peut voir les exemplaires actuellement échangeables du destinataire ; le blocage est appliqué dans les deux sens. Les signalements de profils et chambres passent par la même administration. Limitation de fréquence en base pour l’authentification et le jeu ; les limites ne constituent pas une garantie contre les comptes multiples.

## Assets et rendu

36 SVG originaux sont produits par `scripts/generate-assets.mjs`, avec manifest `public/objects/manifest.json`. Pas de logo, personnage sous licence ou appel à un service d’images à l’exécution. La chambre est un SVG interactif avec des coordonnées fixes dans un repère 900 × 560. Les polices Fraunces et DM Sans sont distribuées localement via Fontsource, sous SIL OFL ; leurs licences figurent dans `public/licenses`.

Les animations respectent `prefers-reduced-motion`. Le son synthétique est facultatif et désactivé par défaut. L’export PNG incorpore les illustrations SVG dans une copie de la scène et rasterise celle-ci à 1800 × 1120. Le fichier exporté est testé dans Chromium.

## Limites connues

- Pas encore de tests Safari/Firefox ni de test sur appareil tactile physique ; les placements à deux clics, au clavier, par glisser-déposer souris et par geste tactile émulé ainsi que le rendu 360 px sont vérifiés dans Chromium.
- Pas d’email réel envoyé dans l’environnement actuel, faute de SMTP. Pas de vérification d’email obligatoire en local.
- Pas de déploiement externe, test de charge ou validation de restauration dans une nouvelle tâche cloud.
- L’administration modifie les noms, descriptions, raretés et statuts des 36 objets ; l’ajout de définitions et changements structurels passent par une migration/seed pour maintenir les six collections.
- Préparer les mentions d’éditeur, durées de conservation, export/suppression des comptes et traitement humain des signalements avant une exploitation publique.
- Les données PostgreSQL vivent dans un volume Docker. Une image d’environnement Codex ne doit pas être supposée sauvegarder ce volume externe : utiliser `pg_dump` et tester la restauration séparément.
