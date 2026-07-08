## Update de LibPhoneNumber

Ce guide explique la démarche à suivre pour mettre à jour la lib libphonenumber-js et mettre à jour les numéros de téléphone erronés dans la db.


1. A la racine, lancer `pnpm update libphonenumber-js@latest -r`

2. Mettre en prod
3. Lancer via la scalingo-cli `scalingo --app if-prod-back run pnpm back trigger-verify-and-fix-phones`

## ⚠️ Important

Lancez la commande **immédiatement après la mise en production**, car les numéros invalides ne passent plus la validation du schéma avec la nouvelle version de `libphonenumber-js`.