# ADR : Gestion des notifications dans l'architecture événementielle

## Contexte

L'application utilise une architecture basée sur des événements. Les use cases d'écriture se terminent par l'émission d'un événement décrivant l'action réalisée (ex: ConventionAdded). Ces événements contiennent le payload complet de l'entité concernée, ce qui permet un audit détaillé des opérations métier.
Actuellement, les notifications sont gérées via un use case séparé qui écoute les événements métier. Par exemple, ConventionAdded déclenche un use case NotifyBeneficiaryThatConventionAdded, qui enregistre une notification et émet un événement NotificationAdded. Ce dernier déclenche l'envoi effectif via le provider d'email.

## Problématique

Deux approches s'opposent pour la gestion des notifications :

### Option A — Notifications dans le use case principal

Le use case métier (ex: AddConvention) gère également la création de la notification et émet les deux événements (ConventionAdded + NotificationAdded).
Avantages :

Contexte transactionnel unique garantissant la cohérence des données
Atomicité : toutes les données sont vraies à l'instant T de la transaction
Pas de risque de modification entre l'événement métier et le traitement de la notification

Inconvénients :

Alourdissement du use case principal avec la logique de notification
Couplage plus fort entre logique métier et logique de notification

### Option B — Notifications dans un use case séparé

Le use case de notification écoute l'événement métier et traite la notification de façon indépendante.

Avantages :

Séparation des responsabilités
Tests plus scopés sur chaque use case
Mapping 1:1 clair entre fonctionnalité et use case de notification

Inconvénients :

Le crawler s'exécute périodiquement (ex: toutes les 5 secondes), donc les données peuvent avoir changé entre l'émission de l'événement et son traitement
Si on utilise uniquement le payload : risque de données obsolètes
Si on re-fetch les données : coût en performance et complexification du use case (gestion des cas d'erreur comme convention absente)

## Points de consensus

Les événements métier conservent le payload complet pour garantir un audit de qualité
La chaîne actuelle en trois étapes est maintenue : événement métier → use case notification → événement NotificationAdded → envoi effectif

## Décisions à prendre

Conserver les use cases séparés ou fusionner la notification dans le use case principal ?
Si use cases séparés : utiliser le payload de l'événement ou re-fetcher les données ?

Payload seul : tests simples, mais données potentiellement obsolètes
Re-fetch : données à jour, mais complexité accrue (requêtes SQL supplémentaires, gestion des cas d'erreur, tests plus lourds)

## Critères de décision

Importance de la cohérence des données au moment de l'envoi de la notification
Tolérance au risque de données légèrement obsolètes (fenêtre de 5 secondes)
Coût de maintenance et lisibilité du code
Complexité des tests

## Décision

Nous adoptons l’approche suivante :

Séparer strictement le métier et la notification

Les notifications sont gérées par des use cases dédiés, déclenchés par des événements.

Les use cases métiers ne contiennent pas de logique de notification.

Dans les use cases de notification : re-fetch systématique des données

Le payload de l’événement est conservé uniquement pour traçabilité.

La notification est construite à partir de l’état actuel en base.

Migration du legacy : règle de l’opportunité (pas de refacto globale)

Tous les nouveaux développements doivent suivre la convention ci-dessus.

Les use cases existants ne sont refactorisés que lorsqu’il y a un bénéfice concret ou un besoin de modification.
