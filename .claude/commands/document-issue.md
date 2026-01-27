Tu dois générer une documentation en **français** pour une issue GitHub, destinée à être postée en commentaire sur cette issue. Le public cible est constitué de **PO, UX designers, PM** qui connaissent bien l'application mais ne sont pas développeurs.

## Déterminer le numéro d'issue

- Si un argument est fourni (`$ARGUMENTS`), l'utiliser comme numéro d'issue.
- Sinon, extraire le numéro depuis le nom de la branche courante (pattern : la branche commence par des chiffres suivis d'un tiret, ex: `4096-etq-utilisateur-...` → issue `4096`).
- Si aucun numéro trouvé, demander à l'utilisateur.

## Récupérer le contexte

1. Récupérer le contenu de l'issue : `gh issue view <N>`
2. Récupérer le diff avec main : `git diff main...HEAD`

## Rédiger la documentation

Rédige un résumé **succinct** (15 lignes max) en français. Le public connaît l'application et ses concepts métier (conventions, agences, établissements, prescripteurs, bénéficiaires, etc.).

Le résumé doit :
- Expliquer **ce qui a été fait** clairement
- Expliquer **ce qui change pour les utilisateurs** (nouveau comportement, changement d'interface, nouvelles règles métier)
- Mentionner les **parties de l'application impactées** (ex: formulaire de convention, back-office admin, page de recherche, emails envoyés, API) sans rentrer dans le code
- Si pertinent, mentionner les **choix structurants** de haut niveau (ex: ajout d'une nouvelle table en base, nouvelle route API, nouveau mail automatique)
- Aller droit au but, pas de remplissage

Ne PAS inclure : noms de fichiers, noms de fonctions, extraits de code.

## Screenshots (changements front-end)

Après avoir analysé le diff, si des fichiers front-end ont été modifiés (répertoires `front/`, `libs/react-design-system/`, ou fichiers `.scss`, `.css`, `.tsx` liés à de l'interface) :

1. Identifier les **pages ou écrans impactés** en analysant les composants/pages modifiés dans le diff (ex: page de recherche, formulaire de convention, back-office, modal de confirmation, etc.)
2. Ajouter à la fin du commentaire une section qui :
   - Signale que des changements d'interface ont été effectués
   - Liste précisément les **screenshots suggérés** en fonction des écrans impactés (ex: "Capture de la page de recherche avec le nouveau bouton", "Capture de la modal de confirmation après modification du wording")
   - Indique de les ajouter directement dans l'issue

## Validation et publication

1. Présenter le résumé à l'utilisateur pour validation.
2. Demander s'il veut modifier quelque chose.
3. Une fois validé, poster en commentaire sur l'issue : `gh issue comment <N> --body "<résumé>"`
