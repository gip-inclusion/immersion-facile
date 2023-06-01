# Organisation de l'équipe de développement

## Règles de comportement pour tous

- 2023-02-16 - Un respect entre tous les membres de l'équipe est attendu.
- 2023-02-16 - Si quelqu'un ne respecte pas les règles, on doit le lui rappeler.

## Règles de développement pour tous

### Les constats de bizarrerie dans la base de code

- 2023-02-16 - N'importe quel membre technique peut signaler des choses qui lui paraissent bizarres sur la partie technique du projet. Cela entrainera des discussions dans l'équipe.
- 2023-02-16 - À créer -> un doc qui référence ces discussions à avoir, elle entraineront des ADR, pour éviter d'avoir plusieurs fois les mêmes discussions quand des réponses sont apportées. Exemple de discussions à avoir :
  - simulated et tests gateway ?
  - quand est-ce qu'on peut utiliser le state interne de redux dans des Epics ?
  - comment on organise les routes du backend pour s'y retrouver plus facilement ?
- 2023-02-16 - On peut sanctuariser un moment pour avoir ces discussions
- 2023-02-16 - L'ensemble de ces discussions a pour objectif que l'équipe converge vers des bonnes pratiques. Et l'équipe devra les respecter.

### Le pair programming

- 2023-02-16 - On essaye de bosser autant que possible en pair programming. Il y a une certaine flexibilité mais c'est une méthode de travail qui permet d'avoir un regard croisé sur les features, et est plus efficace que les reviews à postériori.
- 2023-02-16 - Pas une règle absolu, mais il faut conserver cette objectif de pair autant que possible. Si pas possible, une review est necessaire, et éventuellement une discussion _a posteriori_.

## Le role de développeur

- 2023-02-16 - Développe les fonctionnalités (ou résolution de bug) selon leur priorisation par le métier lors des revues de trello.
- 2023-02-16 - Est responsable du bon maintient en condition opérationnel des applications
- 2023-02-16 - Est force de propositions sur les methodes pour mettre en place ces fonctionnalitées. Les décisions sont prises en pair, ou seul si le travail est fait seul.
- 2023-02-16 - En cas de doute, le developpeur (ou l'équipe de pair) doit contacter les membres de l'équipe qui peuvent le débloquer (dev ou leadDev).
- 2023-02-16 - Le développeur envoie lui même en staging pour recette puis en production son travail (en prévenant les autres pour que l'équipe puisse pousser du travail en bonne intelligence).
- 2023-02-16 - Si des informations manquent, pour des développements, ou que évolutions sont à signaler qui impactent nos partenaire c'est au développeur de se mettre en contact avec les personnes concerné. Cela peut-être le métier, ou éventuellement à des intervenants extérieurs à l'équipe (autres startup partenaires, PE, via mattermost, emails...)
- 2023-02-16 - Fait monter les autres en compétences sur les sujets qu'il maitrise le mieux et qu'il se sent en capacité de le faire.

## Le role du lead

- 2023-02-16 - est aussi un developpeur avec les régles associées
- 2023-02-16 - écoute les réclamations des devs
- 2023-02-16 - est une référence sur la connaissance du produit et du métier
- 2023-02-16 - est une référence sur la base de code, ou peut facilement pointer vers les gens qui ont la connaissance
- 2023-02-16 - garant des pratiques et des standards de l' équipe
- 2023-02-16 - porte parole de l'équipe. Notamment quand c'est pour défendre l'équipe si des deadlines impossibles sont demandées
- 2023-02-16 - tranche quand on arrive pas à trancher

## Processus de décisions de l'équipe

- 2023-02-16 - C'est pour les décisions importante. Se fait en équipe complète !

- 2023-02-16 - On établi le sujet en question :

  1. Chacun donne son opinion
  2. Si la décision est unanime -> on adopte la décision
  3. S' il y a un consensus -> on adopte la décision
  4. Des gens pour / des gens contre
     - jusqu'à majorité 3 / 4 -> on adopte la décision
     - majorité 3 / 5 ou moins -> on adopte pas la décision -> et on prolonge les dicussions
  5. droit de veto pour le lead dev

- 2023-02-16 - Une fois la décision prise, la responsabilité est porté par toute l'équipe.

- 2023-02-16 - Les prises de décisions doivent être documentés dans un ADR, et daté. Si on reviens sur une décision, on refait un autre ADR. Comment la prise de décision a été fait doit être indiqué dans l'ADR.

---

- 2023-02-16 - Voir le point de vue de Nathalie et Jérémy ?
- 2023-02-16 - Situation qu'on souhaite éviter :
  > Ah je vous l'avais bien dit !
