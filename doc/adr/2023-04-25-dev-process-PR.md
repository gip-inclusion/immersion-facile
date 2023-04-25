# Comment s'organise-t-on pour gérer le cycle de vie d'une feature ?

## Process de dev

- Dans stories priorisé on est sensé avoir les story qui sont prêtes à être développées (description claire, intervenants et partenaires identifiés sur le ticket)
- Les story à "faire dans l'itération" sont les prochaines à être développées
- Les dev se mettent d'accord entre eux sur qui prend quoi
- (une fois sur github) Les PR doivent référencer les issues qu'ils implémentent (donc on est sensé créer une issue pour chaque PR commencée)
- Les dev doivent indiquer s'ils ont besoin d'une review en déplaçant l'issue dans le kanban (à "to review")
- Les reviewers font leur commentaire et indique si c'est apprové ou pas.
- S'il y a besoin de changement, l'issue retourne au status in progress
- Si c'est ok, elle est apprové (et/ou on met tag "ready to merge")
- Le dev qui a fait la feature est celui qui merge sur la branche "dev"
- Avant de pousser une staging, un dev doit prévenir sur discord en notifiant @dev (n'importe quel dev peut le faire)
- On prévient le métier qu'il doit faire la recette sur staging en créant un thread sur discord
- Quand le métier dit GO : on pousse sur main ce qui lance un déploiement en prod

- S'il y a quelque chose qui bloque les merges sur dev, il faut prévenir sur discord. Et quand c'est résolu, il faut prévenir sur discord qu'on peut de nouveau merger normalement
