# Passage de ROME 3 à ROME 4

## Status : 2022/05/31 - STAND BY - @Jérome & @Benjamin

## Description

- 2023/02/24 - PE va effectué une migration de ses API afin de passer de ROME 3 à ROME 4

---

## Context

### Prise de note échange PE 2023/02/24

- Accès définissions des API Swagger Rome v4 PôleEmploi.io
- Les informations ne semble pas clair chez PE > les différentes équipes n’ont pas une vision commune
- Rome v4 > 4 APIs en brouillon chez [PE.io](http://PE.io) niveau API Management
- Durée de vie de l’API ROME v3 OK pour 9 mois.
- quid de la nouvelle structure du ROME4 ?
- Prise en compte des ROME 3 par PE pour les faire passer en ROME 4 ?
  - Fichier de correspondance ROME 3 <> ROME 4 existant
- Pour le moment PE supporte encore les ROME 3 car on utilise pas encore les aspect Compétences. On peut donc transiter tranquillement sur ROME 4 au fur et à mesure qu’on nous fournit les documentations et capacités d’appels API

---

## Decision

- 2023/02/24 - Les API PE en ROME 4 sont compatibles sur nos appels en ROME 3 en l'état de nos besoins.
- 2023/02/24 - A terme, utiliser les API [PE.io](http://PE.io) pour faire les appels sur les API ROME4 au lieu de récupérer les codes ROME3 internes à Immersion Facilité
- 2023/02/24 - Point d’attention sur les quotas d’appels API à [PE.io](http://PE.io) pour ces appels qui peuvent être consommateur.

---

## Consequences

- 2023/02/24 - Pas d'évolution à prevoir sauf si on a des fonctionnalités qui ont besoin de l'API ROME 4 (bilan par exemple)
