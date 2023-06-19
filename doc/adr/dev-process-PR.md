# Comment s'organise-t-on pour gérer le cycle de vie d'une feature ?

## 2023/04/25 - Process de dev

1. Dans stories priorisé, on est censé avoir les story qui sont prêtes à être développées (description claire, intervenants et partenaires identifiés sur le ticket)
2. Les story à "faire dans l'itération" sont les prochaines à être développées
3. Les dev se mettent d'accord entre eux sur qui prend quoi
4. Les PR doivent référencer les issues qu'elles implémentent (donc on est censé créer une issue pour chaque PR commencée)
5. Les dev doivent indiquer s'ils ont besoin d'une review en déplaçant l'issue dans le kanban (à "to review" + message dans le Discord sur #dev)
6. Les reviewers font leur commentaire et indiquent si c'est approuvé ou pas.
7. S'il y a besoin de changement, l'issue retourne au status in progress
8. Si c'est ok, elle est approuvé (et/ou on met tag "ready to merge")
9. Le dev qui a fait la feature est celui qui merge sur la branche "main"
10. Avant de pousser une staging, un dev doit prévenir sur Discord en notifiant @dev (n'importe quel dev peut le faire), sur le channel #dev
11. On prévient le métier qu'il doit faire la recette sur staging en créant un thread sur Discord (dans #staging-notifications, en partant de message de mise en staging)
12. Quand le métier dit GO : on pousse lance de déploiement en prod
13. S'il y a quelque chose qui bloque les merges sur 'main', il faut prévenir sur Discord (sur #general ou #dev). Et quand c'est résolu, il faut prévenir sur discord qu'on peut de nouveau merger normalement
