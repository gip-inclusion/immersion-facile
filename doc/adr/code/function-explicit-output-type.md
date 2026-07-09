# Typage explicite des retours des fonctions 

## Status : 2026-06-30 - Accepté

## Description

Typer idéalement les retour de fonction explicitement et ne pas laisser Typescript inférer le type.



## Contexte

On a deux approches concurrentes dans le code au niveau du retour des fonctions:
- spécifier le typage explicitement
- laisser typescript inférer le type en fonction du contenu de la fonction et du retour

Laisser typescript inférer le typage sous-entend une consommation des ressources du serveur TS et impacte les performances/reactivité des IDE / typecheck.  
Certaines fonctions spécifiques seraient trop compliquées à typer explicitement et pour des gains minimes ( builders ) .


Biome / linter n'est pas à date une solution viable pour interdire l'inférence de type car la règle de biome ne se limite pas aux fonctions et générerait trop d'erreurs de lint.

### Proposition
Par défaut, il faudrait typer explicitement les fonctions car en plus des soucis de perf, cela permet de documenter la fonction et de conserver son contenu comme un implémentation qui n'est pas nécéssaire d'analyser à partir du moment où le contrat de typage est respecté.

Mais on ne peut pas en faire une règle absolue ( MUST vs SHOULD )

Un code typé explicitement permettra aussi aux nouveaux / juniors ne mieux se familiariser avec le code.

## Decision

Les retours de fonction sont typés explicitement dans l'idéal mais il est possible de conserver l'inférence de type quand ce n'est pas possible / trop complexe.

Le passif du code sera retravaillé pendant les actions de développement courantes dans le cadre des refactos liés au sujet développé.