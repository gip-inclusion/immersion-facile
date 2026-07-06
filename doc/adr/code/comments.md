# Les commentaires dans le code

## Status : 2026-06-30 - Accepté

## Description

Clarifier les cas où les commentaires sont souhaités.

Quel est notre position sur les commentaires et le nommage pour les devs d’IF ?

## Contexte

- Historiquement, l'équipe ne fait pas de commentaire dans le code hormis
  - les TODOs
  - de la documentation technique spécifique et pas simple à retrouver ( particulièrement pour les adapters exemple : FT.io / INSEE )
  - linter ignore
- Avec l'IA, certaines PR, inclus maintenant des commentaires 
- Le code est nommé afin de décrir l'intention voulue (fonctions, constantes, classes, DTOs, conditions ...)
  - Si la description n'est pas claire / trop longue / ambigue, c'est que la portion de code nommé fait trop de chose ( code smell )


Un ADR n'a pas été fait depuis car il faisait partie des règle de socle de l'équipe.

Les TODOs ne sont pas revus par l'équipe. Certaines TODO sont là depuis tellement longtemps que la question se pose de les supprimer sans en discuter.

### Proposition

Etablir cet ADR permet d'officialiser la règle et d'indiquer aux IA de la suivre.

Si une TODO été faite à l'époque, il peut être interessant de faire au moins une présentation à l'équipe pour statuer si c'est pertinant de le faire ou pas sous la forme des taches tech ?

## Decision

Décision usage des commentaires :

- linter ignore
- Adapters techniques > lien documentation tierce / point d’attention

Les commentaires pour décrire le comportement du code n’est pas autorisé : utiliser la pratique de nommage

Ne plus faire de nouvelles TODO et conversion des TODO existantes en tâches TECH progressivement afin de ne plus avoir de TODO à terme.