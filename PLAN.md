# Le Grenier — plan de réalisation

1. Initialiser Next.js/TypeScript, PostgreSQL, Drizzle et Better Auth ; écrire les règles transactionnelles et le catalogue de 36 objets illustrés.
2. Livrer l'accueil et l'ouverture atomique, puis la collection et la chambre avec sauvegarde versionnée.
3. Conserver l'essai lors de l'inscription ; ajouter badges, partage volontaire et export PNG.
4. Livrer les échanges réservés, le blocage, les signalements et l'administration protégée.
5. Exécuter tests métier/intégration, parcours navigateur, types, lint et build ; documenter le lancement et les limites.

## Choix

- Application monolithique, français uniquement ; PostgreSQL est la source de vérité.
- Développement local sans service payant : PostgreSQL local ou Docker Compose. Aucun remplacement par localStorage.
- Illustrations SVG originales servies localement ; pièce en coordonnées logiques et emplacements fixes accessibles.
- Les six collections débloquent des décorations fixes, distinctes des objets tirables.
- Pas de déploiement externe sans autorisation.
