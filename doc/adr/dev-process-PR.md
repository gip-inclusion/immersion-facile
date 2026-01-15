# Comment s'organise-t-on pour gérer le cycle de vie d'une feature ?

## 2026/01/06 - Process de dev

1. Dans "Prêt à développer", on est censé avoir les story qui sont prêtes à être développées (description claire, intervenants et partenaires identifiés sur le ticket)
2. Les story à "faire dans l'itération" sont les prochaines à être développées
3. Les dev se mettent d'accord entre eux sur qui prend quoi
4. Une story prise en charge par un/des devs doit avoir :
   - les devs assignés dessus
   - la story placée dans "En développement"
5. Les PR doivent référencer les issues qu'elles implémentent
   - Si une PR est créée sans Issue on est censé l'ajouter dans le backlog du projet
6. Les dev doivent indiquer s'ils ont besoin d'une review
   - en déplaçant l'issue dans le kanban à "Ready for Review"
   - faire un message dans le Slack sur #if-dev de type "RfR > [lien de la PR] + description de la PR"
7. Les reviewers qui ne sont pas les développeurs qui ont développé font leur commentaire et indiquent si c'est approuvé ou pas.
8. Si c'est ok, elle est approuvée et elle est dans la colonne "A merger"
9. Le dev qui a fait la feature est celui qui merge sur la branche "main"
10. Quand les devs veulent faire une release, on prévient @if-produit et @if-devs qu'une recette est faisable sur la staging en créant un thread sur Slack (dans #if-staging-déploiement, en partant du message de déploiement de la pré-release)
    - Pendant la recette, on bloque le merge de PR
    - Pour du détail sur la recette voir [la documentation du processus de recette](https://github.com/gip-inclusion/immersion-facile/blob/main/doc/adr/review-and-deployment-process.md).
11. Quand le métier a validé la recette, on lance le déploiement en prod.

