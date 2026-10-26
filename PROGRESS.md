# Progression — Le Grenier

Mise à jour : 26 octobre 2026.

## Terminé

- Initialisation Next.js/React/TypeScript, PostgreSQL réel via Compose, Drizzle, Better Auth, migrations reproductibles et seed idempotent.
- 36 objets et 36 SVG originaux, six collections et décorations, cinq badges ; manifest et licences des polices locales.
- Session invitée, stock/recharge UTC, tirages serveur, ouverture atomique et idempotente, historique et révélation progressive récupérable.
- Accueil illustré, collection filtrable, recherche, favoris, doublons, silhouettes et fiches d’exemplaires.
- Chambre avec surfaces/empreintes, placement, déplacement/retrait, souris, clavier, geste tactile avec défilement, sauvegarde versionnée, thèmes et couleurs.
- Comptes avec conservation de l’essai à l’inscription ; connexion à un compte existant sans fusion ni écrasement.
- Badges, publication privée/publique révocable, métadonnées Open Graph, partage et capture PNG 1800 × 1120.
- Échanges réservés, acceptation idempotente et transactionnelle, refus/annulation/expiration paresseuse, blocage, signalements de profils/chambres, notifications internes.
- Administration protégée côté serveur, commande d’attribution/révocation du rôle, catalogue, paramètres, signalements et audit.
- Règles, confidentialité, README, architecture et commandes de lancement ; tests isolés des données de développement.
- Préparation Vercel : installation/compilation configurées, migrations et catalogue automatiques, connexion PostgreSQL fournie par l’intégration Neon, origine du site détectée depuis les variables système, guide de mise en ligne depuis le navigateur.

## Vérifications obtenues

- **24/24 tests réussis**, aucun ignoré : recharge/plafond, distribution, catalogue actif, idempotence, concurrence, propriété, placement, versions, vie privée, transferts, expiration, blocage, récompenses, autorisation administrateur et résolution sécurisée des origines Vercel/locales/personnalisées.
- **5/5 parcours Chromium réussis** : parcours invité jusqu’au compte/partage/révocation ; vues mobile 360 px ; protection session/CSRF/admin ; échange réel par l’interface entre deux comptes ; conservation du compte existant et séparation de l’essai.
- Le parcours principal vérifie également le déplacement par glisser-déposer souris, le placement au clavier et le téléchargement PNG. Le parcours mobile enrichi a été relancé et valide un geste tactile émulé dans Chromium.
- Accueil, ouverture, collection et chambre inspectés visuellement en desktop/mobile ; aucun débordement horizontal dans les quatre vues à 360 px. Aperçus conservés dans `docs/previews`.
- Réinstallation `npm ci` depuis le lockfile réussie ; TypeScript, ESLint et compilation de production réussis. Commande `npm run setup` rejouée sans réinitialiser les données.
- Serveur de production démarré sur le port 3000 : accueil, santé PostgreSQL et image Open Graph répondent 200. Une véritable session invitée et une ouverture persistante de trois objets ont été vérifiées sur ce build ; la répétition avec la même clé retourne la même ouverture. La session de ce contrôle a ensuite été supprimée.
- Secret d’authentification absent des 31 fichiers JavaScript publics du build ; `.env`, dépendances et fichiers de build ignorés par Git.
- Compilation Vercel simulée réussie dans une copie sans `.env` : secret privé injecté, `POSTGRES_URL` utilisée sans `DATABASE_URL`, domaine Vercel détecté sans `BETTER_AUTH_URL`, migrations/catalogue puis compilation Next.js. Aucun déploiement réel dans le compte Vercel validé.
- Champs `install_script` et `start_skill` enregistrés avec succès dans le brouillon de configuration Codex. Leur activation pour les futures tâches demande une revue/enregistrement des paramètres puis la publication de l’environnement dans l’interface. Aucun environnement publié et aucune restauration en nouvelle tâche revendiqués.

## En cours

- La boucle locale est livrée. Le propriétaire a choisi Vercel ; la création du projet et la connexion à une base PostgreSQL restent à effectuer depuis son compte en suivant [le guide](docs/MISE-EN-LIGNE.md).

## Blocages et limites concrètes

- Aucun blocage pour jouer localement. Pas de clé d’un service payant nécessaire.
- Aucun SMTP configuré : récupération de mot de passe annoncée indisponible ; branchement prêt via `SMTP_URL`/`MAIL_FROM`, aucun email réel testé.
- Le téléchargement Playwright est refusé par la politique réseau ; les tests passent avec le Chromium système (`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`).
- Safari/Firefox, appareils tactiles physiques, charge et restauration dans une nouvelle tâche cloud non validés. Le volume Docker n’est pas présumé inclus dans un instantané Codex.
- Aucun déploiement externe effectué. Mentions d’éditeur, procédures de suppression/export de compte et politique de conservation à compléter avant exploitation publique.
- Administration limitée à la modification/archivage des définitions existantes ; nouveaux objets et changements structurels via migration. Verrou global de jeu à affiner pour un fort trafic.

## Prochaines améliorations utiles

1. Brancher et tester SMTP sur l’infrastructure choisie ; compléter les informations d’éditeur et procédures de gestion des données.
2. Tester Safari/Firefox et de vrais gestes tactiles ; effectuer un audit d’accessibilité complet.
3. Tester sauvegarde/restauration PostgreSQL et montée en charge avant toute ouverture publique.
