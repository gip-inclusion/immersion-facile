# Comment s'organise-t-on pour gérer le cycle de vie d'une feature ?

## 2023/04/25 - Process de dev

1. Dans stories priorisé on est sensé avoir les story qui sont prêtes à être développées (description claire, intervenants et partenaires identifiés sur le ticket)
2. Les story à "faire dans l'itération" sont les prochaines à être développées
3. Les dev se mettent d'accord entre eux sur qui prend quoi
4. (une fois sur github) Les PR doivent référencer les issues qu'ils implémentent (donc on est sensé créer une issue pour chaque PR commencée)
5. Les dev doivent indiquer s'ils ont besoin d'une review en déplaçant l'issue dans le kanban (à "to review")
6. Les reviewers font leur commentaire et indique si c'est apprové ou pas.
7. S'il y a besoin de changement, l'issue retourne au status in progress
8. Si c'est ok, elle est apprové (et/ou on met tag "ready to merge")
9. Le dev qui a fait la feature est celui qui merge sur la branche "dev"
10. Avant de pousser une staging, un dev doit prévenir sur discord en notifiant @dev (n'importe quel dev peut le faire)
11. On prévient le métier qu'il doit faire la recette sur staging en créant un thread sur discord
12. Quand le métier dit GO : on pousse sur main ce qui lance un déploiement en prod
13. S'il y a quelque chose qui bloque les merges sur dev, il faut prévenir sur discord. Et quand c'est résolu, il faut prévenir sur discord qu'on peut de nouveau merger normalement
