# Husky

Il y a un script pour chaque hook

## Pre-commit hook

[//]: # (// Le pre-commit hook execute `lint-staged` script)

[//]: # (## Lint-staged)

[//]: # ()
[//]: # ([Documentation]&#40;https://github.com/okonet/lint-staged&#41;)

[//]: # ()
[//]: # (The current configuration run the linter and prettier on 'staged' files &#40;files where git has detected a modification&#41;)

## Pre-push hook

Le pre-push hook execute
- pnpm prettier:check => Vérifie que tous les fichiers ont un formatage valide

[//]: # (- eslint ./\*\*/src/ => Check lint on all files in sources directories)

[//]: # (- pnpm test => Run all tests not needing dependencies)