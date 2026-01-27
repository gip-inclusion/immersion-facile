Tu travailles sur une branche qui n'a pas encore d'issue GitHub associée. Tu dois créer cette issue pour documenter le travail en cours, puis préparer le terrain pour que la future PR soit correctement liée.

Le public cible de l'issue est constitué de **PO, UX designers, PM** qui connaissent bien l'application mais ne sont pas développeurs.

## Récupérer le contexte

1. Récupérer les commits de la branche : `git log main..HEAD --oneline`
2. Récupérer le diff avec main : `git diff main...HEAD`
3. Récupérer le nom de la branche courante : `git branch --show-current`

## Rédiger l'issue

À partir des commits et du diff, rédige un **titre** et un **corps** d'issue en français.

### Titre

Court et descriptif, du point de vue utilisateur ou du changement métier. Pas de préfixe technique.

### Corps

Rédige un résumé **succinct** (15 lignes max) en français. Le public connaît l'application et ses concepts métier (conventions, agences, établissements, prescripteurs, bénéficiaires, etc.).

Le résumé doit :
- Expliquer **ce qui doit être fait / a été fait** clairement
- Expliquer **ce qui change pour les utilisateurs** (nouveau comportement, changement d'interface, nouvelles règles métier)
- Mentionner les **parties de l'application impactées** (ex: formulaire de convention, back-office admin, page de recherche, emails envoyés, API) sans rentrer dans le code
- Si pertinent, mentionner les **choix structurants** de haut niveau (ex: ajout d'une nouvelle table en base, nouvelle route API, nouveau mail automatique)
- Aller droit au but, pas de remplissage

Ne PAS inclure : noms de fichiers, noms de fonctions, extraits de code.

## Validation

1. Présenter le titre et le corps de l'issue à l'utilisateur pour validation.
2. Demander s'il veut modifier quelque chose.
3. Ne passer à l'étape suivante qu'une fois validé.

## Créer l'issue

Créer l'issue sur GitHub : `gh issue create --title "<titre>" --body "<corps>" --assignee @me`

La commande `gh issue create` retourne l'URL de l'issue créée (ex: `https://github.com/org/repo/issues/4300`). Extraire le numéro d'issue depuis cette URL (le dernier segment numérique).

## Lier la branche à l'issue

### Renommer la branche

Vérifier si la branche a déjà été pushée sur le remote :

```
git ls-remote --heads origin <nom-branche-courante>
```

- **Si la branche n'a PAS été pushée** : proposer de la renommer en `<numéro-issue>-<slug-du-titre>` (slug : titre en minuscules, espaces remplacés par des tirets, sans caractères spéciaux, sans accents). Si l'utilisateur accepte, exécuter `git branch -m <nouveau-nom>`.
- **Si la branche a déjà été pushée** : ne pas proposer de renommer, passer directement à la suite.

### Créer un commit de référence

Créer un commit vide qui référence l'issue, pour que le lien soit établi même avant la PR :

```
git commit --allow-empty -m "Refs #<numéro-issue>"
```

## Créer la PR en draft

Pusher la branche et créer une PR en draft liée à l'issue :

```
git push -u origin <nom-branche>
gh pr create --draft --title "#<numéro-issue> - <titre-issue>" --body "Fixes #<numéro-issue>"
```

Le titre de la PR suit le format du projet : `#<numéro-issue> - <description courte>`.
Exemple : `#4096 - Durée de vie du lien de connexion passée à 15 min`

`Fixes #<numéro-issue>` dans le corps permet à GitHub de fermer automatiquement l'issue au merge.

Afficher l'URL de la PR créée à l'utilisateur.
