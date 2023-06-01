# Front code organisation

## Status : 2022/12/01 - APPROVED - TEAM UNANIMITY

## Description

### Principes

- Emplacement du composant ne doit pas dépendre du contexte (page/section/….)
- Un composant doit être réutilisable
- 2 types de composants:
  - Intelligent : inclus de la logique interne couplée (touche à redux par exemple) ⇒ dans le projet (/front)
  - bête/headless : ne comporte pas de logique interne ou bien expose sa possibilité de logique par inversion de dep ⇒ dans les libs

## Context

- Le code actuel est organisé parfoi de manière chaotique

## Decision

### 2022/12/01 - Structure envisagée

- **src**
  - assets: assets statiques
    - css
    - fonts
    - img
    - media : vidéos/sons
  - icons: à supprimer
  - uiComponents: à supprimer
  - **app**
    - **contents**: tout les texts/jsx statiques / i18n
      - suffix en .content.ts
    - **components** : les composants intelligents de IF
      - Nos smart components (type de composant ex: forms)
      - Du context si nécéssaire (type de form)
      - sous dossier sections quand un smart component est trop grande
      - Grands sous structures:
        - layout
    - **pages** : nom du composant se termine par Page, ne contient pas de sous section (elle seront dans Components)
    - **routes**: nos éléments de routing qui appels un composant page ge
    - **hooks** : \*.hooks.ts (groupes de hooks), à partir du moment où ils sont réutilisé plusieurs fois. En cas d’usage unique, le hook peut rester dans son propre composant.
  - **config:** plomberie d’instantiation de dépendances
  - **core-logic**

Les composants headless vont partir dans la lib react-design-system.

#### Composants candidats headless react-design-system

Faire un commentaire dans le composant en TODO

## Consequences

- 2022/12/01 - Déplacement des modules de code en accord avec l'organisation proposée
