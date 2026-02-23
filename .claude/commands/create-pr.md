Tu dois créer une Pull Request en draft pour la branche courante. L'issue GitHub existe déjà et son numéro est dans le nom de la branche.

## Récupérer le contexte

Exécuter en parallèle :

1. Nom de la branche : `git branch --show-current`
2. Commits depuis main : `git log orgin/main..HEAD --oneline`
3. Diff stats : `git diff origin/main...HEAD --stat`
4. Vérifier si la branche est pushée : `git ls-remote --heads origin $(git branch --show-current)`

## Extraire le numéro d'issue

Le nom de la branche commence par des chiffres suivis d'un `-` (ex: `4369-tech-limiter-appels-ft`). Extraire ce numéro comme numéro d'issue.

Si aucun numéro n'est trouvé, demander à l'utilisateur.

## Générer le titre de la PR

Analyser les commits et le diff pour :

1. **Déterminer si c'est Tech** : si les changements ne concernent que de l'infra, performance, outillage, refactoring interne, CI/CD, ou dépendances — sans impact fonctionnel visible pour les utilisateurs — c'est Tech.
2. **Rédiger un titre court en français**, compréhensible par un PO/PM (pas de jargon technique).

Format du titre :
- Standard : `#<numéro-issue> - <description en français>`
- Tech : `#<numéro-issue> - Tech - <description en français>`

Exemples :
- `#4096 - Durée de vie du lien de connexion passée à 15 min`
- `#4200 - Tech - Mise en place du rate limiting sur les appels France Travail`

## Validation

Présenter le titre proposé à l'utilisateur et demander validation. Ne continuer qu'après accord.

## Créer la PR

1. Lire le contenu du fichier `.github/PULL_REQUEST_TEMPLATE.md`
2. Construire le body de la PR : `Fixes #<numéro-issue>` suivi d'une ligne vide puis du contenu du template
3. Si la branche n'est pas pushée : `git push -u origin <branche>`
4. Créer la PR :

```
gh pr create --draft --base main --assignee @me --title "<titre>" --body "<body>"
```

## Résultat

Afficher l'URL de la PR créée.
