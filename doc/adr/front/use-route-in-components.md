# Utilisation des routes dans les composants

## Status : 2026/05/05 - APPROVED

## Description

Définit comment les composants front doivent consommer les informations liées à la route.

## Context

Certains composants accèdent directement aux paramètres de route, créant un couplage fort entre la logique de routing et les composants réutilisables.

## Decision

### 2026/05/05 - Consommation de la route dans les composants de page

- Les composants de **page** sont responsables de consommer tout ce qui se rapporte à la route (params, query string, etc.) et de le transmettre aux composants enfants via les props.
- Les composants réutilisables ne doivent **pas** dépendre de la route directement.

### Cas legacy ou contraignant

Lorsque la migration est trop contraignante ou dans le code legacy, utiliser un utilitaire dédié (e.g.: `useTypedRoute`) pour récupérer la route de manière typée, afin d'éviter les `as`.

## Consequences

- Meilleure réutilisabilité des composants (indépendants du routing).
- Les composants de page deviennent le point d'entrée unique pour les données de route.
- Le cast non typé (`as`) est à proscrire au profit de `useTypedRoute`.
