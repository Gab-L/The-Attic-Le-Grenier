# Utiliser Le Grenier avec Vercel

Le code est configuré pour Vercel. La création du projet et de sa base de données se fait dans votre compte.

## Depuis votre navigateur

1. **[Ouvrir la configuration Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FGab-L%2FThe-Attic-Le-Grenier%2Ftree%2Fcodex%2Fle-grenier-vercel&project-name=le-grenier&repository-name=le-grenier&env=BETTER_AUTH_SECRET&envDescription=Cr%C3%A9ez%20un%20secret%20al%C3%A9atoire%20priv%C3%A9%20d%E2%80%99au%20moins%2032%20caract%C3%A8res%20et%20conservez-le%20dans%20Vercel.&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)**, puis vous connecter à Vercel et à GitHub si demandé. L’assistant copie le code de la branche `codex/le-grenier-vercel` dans un dépôt de votre compte, puis crée le projet `le-grenier`.
2. Dans l’étape de stockage, choisir **Neon / PostgreSQL**, créer ou connecter une base au projet et valider l’offre affichée. Cette base conserve les comptes, objets et chambres. La connexion est ajoutée aux variables du projet par l’intégration.
3. Renseigner **BETTER_AUTH_SECRET** avec une nouvelle valeur aléatoire d’au moins 32 caractères. Le lien proposé dans l’assistant permet d’en générer une ; un gestionnaire de mots de passe convient aussi. Conserver ce secret dans Vercel, sans l’envoyer dans le chat ni le mettre dans GitHub.
4. Cliquer sur **Deploy**, attendre l’état **Ready**, puis **Visit**. Vercel fournit une adresse HTTPS terminant par `.vercel.app` : c’est le lien à conserver pour ouvrir le jeu. Aucun nom de domaine personnel n’est nécessaire.

L’adresse exacte dépend du nom disponible dans votre compte. Le lien de configuration ci-dessus n’est pas une adresse de jeu déjà en ligne.

## Si la première construction échoue

- **Base absente** : ouvrir le projet Vercel → **Storage**, ajouter Neon/PostgreSQL et connecter la base à ce projet pour l’environnement **Production**. Dans **Settings → Environment Variables**, vérifier la présence de `DATABASE_URL` ou `POSTGRES_URL` sans exposer sa valeur. Puis relancer avec **Deployments → Redeploy**.
- **Secret absent** : ajouter `BETTER_AUTH_SECRET` dans les variables du projet pour **Production**, puis redéployer.
- **Code inaccessible** : autoriser Vercel à lire le dépôt GitHub demandé. Le code source préparé est sur la branche [codex/le-grenier-vercel](https://github.com/Gab-L/The-Attic-Le-Grenier/tree/codex/le-grenier-vercel).

## Configuration automatique

`vercel.json` utilise Next.js, installe les dépendances puis lance `npm run build:vercel`. Cette commande vérifie les variables nécessaires, applique les migrations, ajoute le catalogue manquant et compile le site. Elle ne supprime ni les joueurs ni les collections existantes. Aucun Docker, terminal ou fichier `.env` n’est nécessaire dans Vercel.

Les fonctions du jeu s’exécutent à Francfort (`fra1`), dans la même région que la base Neon choisie pour ce projet. Cela réduit le temps des échanges avec la base. Pour une nouvelle installation, choisir également Frankfurt pour Neon, ou adapter `regions` à la région de sa base.

L’application détecte l’adresse de production fournie par Vercel pour les connexions, la protection des requêtes et les métadonnées. Laisser activée l’exposition des variables système de Vercel. Pour un domaine personnel ultérieur, l’ajouter dans **Settings → Domains**, définir `BETTER_AUTH_URL=https://votre-domaine` pour **Production**, puis redéployer et utiliser cette adresse.

Les déploiements de prévisualisation utilisent leur propre adresse. Les connecter à une base distincte de la production, car chaque construction exécute les migrations et le catalogue. Un changement d’adresse ne transfère pas les sessions invitées : créer un compte pour retrouver sa progression sur le domaine définitif.

`SMTP_URL` et `MAIL_FROM` sont facultatifs ; sans eux, la récupération d’un mot de passe par email est indisponible. Les sauvegardes de la base et les informations d’éditeur restent à configurer pour une ouverture publique.

## Après le déploiement

Ouvrir le site, créer une session invitée, ouvrir un carton, placer un objet puis créer un compte et recharger. La progression doit être conservée. Le chemin `/api/health` doit répondre HTTP 200 avec `{"status":"ok"}`.

Les tests locaux et la compilation avec les variables Vercel vérifient la préparation du code ; ils ne valident pas un déploiement réel dans votre compte. Les tarifs et quotas applicables sont ceux affichés par Vercel et le fournisseur PostgreSQL lors de la création.
