# La validation d'un comportement identique des adapters

## Status : 2026-06-30 - Accepté

## Description

Confirmer à tout moment que le comportement de toutes les implémentations d'un port ( architecture port/adapter ) aient un comportement identique pour le métier qui les consomme.



## Contexte

Historique de différence de comportement entre repo ayant généré du support/bug :
- UserRepository
- ConventionRepo et/ou Query
- AgencyRepo

Ce n'est pas une pratique mise en place à date sur le code.
Un exemple/démo a été fait en mars pour expérimenter la pratique sur UserRepository suite à une comparaison entre l'implémentation PG vs InMemory :
[Lien vers le commit en question](https://github.com/gip-inclusion/immersion-facile/commit/6f3a3831c7755214536ae54cd10b8042d24d8a7e)

Cette démo consiste à jouer les mêmes tests d'intégration du repo PG mais sur le repo InMemory.
Rappel : les tests d'intégration valident le comportement des méthodes du port consommé par le métier.

Si un écart est constaté, il est important de se poser la question de quel comportement conserver : InMemory ou PG ? 
Tout en sachant que le comportement de production est le comportement PG et le comportement de validation des scénarios de conception métier (spec fonctionnelle) utilisent le comportement InMemory.

### Proposition

Mettre en place une vérification que le comportement de l'implem de test fonctionnel est identique à l'implémentation de production et idéalement de façon automatisé (ce qui est fait n'est plus à faire).

Par contre ce n'est pas gratuit.

Si on ne le fait pas:

- Différence de comportement possible entre tests métiers et situations de prod (c’est pas ce qu’on veut)
- Difficile à debug (plongée dans le code pour savoir si métier / adapter)
- Aucun filet de sécurité si on ajoute des différences de comportement
- Libre à chaque dev de s’assurer que l’implem de prod a le même comportement que l’implem inmemory à chaque évolution des ports / adapters
- Augmentation dans le temps des erreurs / bugs

Si on le fait :

- Temps pour doubler les tests (dépend de la situation des TI pour les rendre compatibles tests InMemory)
- Temps pour résoudre les soucis si comportement pas identique
- Vérifié à tout moment (test d’intégration vérifié en CI)
- Ajouter une méthode supplémentaire est defacto fait pour l'intégration PG, donc la cohérance sera prouvée aussi.


## Decision

Le gain apporté est reconnu et souhaité sur le long terme donc il est entendu que ce sera appliqué sur l'ensemble des repos.
Étant donné le coût, il faudrait idéalement le faire par IA du moins pour l'amorce et ne pas rattraper tout d'un coup.
 
Il n'y a pas d'action pour appliquer la pratique partout en une fois. Ce sera fait au fil de l'eau.  

Les repos à faire par priorité sont:
- les repos simples car rapide à faire (pas de couplage inter repo aka jointures)
- les repos qui sont liés à des bugs / remontés support / forte suspicion

Dans tout les cas, si on constate le besoin de tester les repos en double pendant un dev classique, il faudra proposer ce travail de test double au travers d'une tâche TECH.
