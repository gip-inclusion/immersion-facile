# Immersion Facilitée - Guide d'intégration

> Généré par OpenSecKit v4.0.0 - /osk-discover (Phase 6 : Synthèse)
>
> **Public cible** : Nouveaux membres de l'équipe

---

## Bienvenue

Bienvenue chez **Immersion Facilitée** ! Ce guide vous aidera à être opérationnel rapidement.

### Vision

> Moderniser et dématérialiser entièrement le processus des immersions professionnelles pour les bénéficiaires, les entreprises et les organismes d'accompagnement.

### Proposition de valeur

| Pour les utilisateurs | Pour le métier |
|-----------------------|----------------|
| Processus entièrement numérique pour les demandes d'immersion | Réduction du temps administratif |
| Vue centralisée pour le personnel des agences | Traçabilité complète |
| Inscription et recherche d'entreprise facilitées | Conformité réglementaire |

---

## Démarrage

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/gip-inclusion/immersion-facile.git
cd immersion-facile
```

### Étape 2 : Configuration du développement

```bash
# Installer les dépendances
pnpm install

# Démarrer les services Docker (PostgreSQL, Redis)
docker-compose up -d

# Exécuter les migrations de base de données
pnpm --filter back db:migrate

# Alimenter les données de développement
pnpm --filter back db:seed

# Démarrer les serveurs de développement
pnpm dev
```

### Étape 3 : Vérifier l'installation

| Service | URL | Attendu |
|---------|-----|---------|
| Frontend | http://localhost:3000 | L'application se charge |
| API Backend | http://localhost:3000/api | L'API répond |

Pour les instructions détaillées, voir le [Guide du développeur](./developer.md).

---

## Vue d'ensemble technique

### Style d'architecture

**Architecture Hexagonale** (Ports & Adaptateurs) avec des principes de Domain-Driven Design.

### Stack technique

| Couche | Technologies |
|--------|--------------|
| **Langages** | TypeScript 5.8 |
| **Frontend** | React 18, Vite, Redux Toolkit, DSFR |
| **Backend** | Node.js 22, Express.js, Kysely |
| **Base de données** | PostgreSQL 13, Redis |
| **Infrastructure** | Scalingo (PaaS), S3 (Cellar) |

### Statistiques clés

| Métrique | Nombre |
|----------|--------|
| Composants | 9 |
| Catégories de données | 10 |
| Intégrations | 12 |
| Fonctionnalités | 9 |

Pour les détails d'architecture, voir le [Guide d'architecture](./architecture.md).

---

## Ressources de connaissances

### Glossaire du domaine

| Terme | Définition |
|-------|------------|
| **PMSMP** | Période de Mise en Situation en Milieu Professionnel (immersion professionnelle) |
| **Convention** | Accord entre bénéficiaire, établissement et agence pour une immersion |
| **SIRET** | Identifiant d'entreprise français (14 chiffres) |
| **ROME** | Code de classification des métiers français (Répertoire Opérationnel des Métiers et des Emplois) |
| **France Travail** | Service public de l'emploi français (anciennement Pôle Emploi) |

*Voir [glossary.yaml](../system-model/glossary.yaml) pour le vocabulaire complet.*

### Types d'agences

| Code | Description |
|------|-------------|
| `france-travail` | Agence France Travail |
| `mission-locale` | Agence emploi jeunes (16-25 ans) |
| `cap-emploi` | Agence emploi handicap |
| `conseil-departemental` | Conseil départemental |
| `structure-IAE` | Structure d'insertion par l'activité économique |

---

## Informations organisationnelles

### Structure de l'équipe

| Équipe | Responsabilités | Contact |
|--------|-----------------|---------|
| **Développement Core** | Fonctionnalités, bugs, revues de code | tech-lead |
| **Plateforme** | Infrastructure, déploiements, supervision | ops-team |
| **Produit** | Stratégie, UX, priorisation | product-team |

### Canaux de collaboration

| Objectif | Outil |
|----------|-------|
| Communication | Discord / Mattermost |
| Gestion de projet | GitHub Issues |
| Documentation | GitHub Wiki / Notion |
| Revue de code | GitHub Pull Requests |

---

## Checklist d'intégration

### Avant de commencer

- [ ] Formation de sensibilisation à la sécurité effectuée
- [ ] Ce guide d'intégration lu
- [ ] Accords nécessaires signés

### Jour 1

- [ ] Accès au dépôt accordé (GitHub)
- [ ] Accès au dashboard Scalingo
- [ ] Canaux de communication rejoints
- [ ] Environnement de développement configuré
- [ ] L'application fonctionne en local

### Semaine 1

- [ ] Lire le [Guide du développeur](./developer.md)
- [ ] Lire le [Guide d'architecture](./architecture.md)
- [ ] Parcourir un parcours utilisateur (créer une convention)
- [ ] Comprendre la structure du projet
- [ ] Première PR soumise (petite correction/amélioration)

### Mois 1

- [ ] Première fonctionnalité/correction terminée
- [ ] À l'aise avec la navigation dans le code
- [ ] Capable de revoir les PRs des autres
- [ ] Comprendre les concepts du domaine
- [ ] Lire le [Guide de sécurité](./security.md)

---

## Parcours d'apprentissage

| Priorité | Document | Public | Description |
|----------|----------|--------|-------------|
| 1 | [Guide du développeur](./developer.md) | Développeurs | Workflow de développement, standards de code |
| 2 | [Guide d'architecture](./architecture.md) | Développeurs, Architectes | Conception système, patterns, flux de données |
| 3 | [Guide de sécurité](./security.md) | Tous | Contrôles de sécurité, conformité, lacunes |
| 4 | [Guide des opérations](./operations.md) | DevOps, SRE | Déploiement, supervision, runbooks |
| 5 | [Guide produit](./product.md) | PMs, Parties prenantes | Fonctionnalités, KPIs, roadmap |

### ADRs (Architecture Decision Records)

Décisions clés documentées dans `doc/adr/` :

| ADR | Sujet |
|-----|-------|
| dev-process-PR.md | Consignes PR et processus de revue |
| hexagonal-architecture.md | Justification du style d'architecture |
| dsfr-design-system.md | Choix du design system |

---

## Sensibilisation à la sécurité

### Points clés

1. **Ne jamais committer de secrets** - Utiliser les variables d'environnement
2. **Gestion des DCP** - Minimiser les données personnelles dans les logs
3. **Revue de code** - La sécurité fait partie de chaque revue
4. **Signaler les problèmes** - Si vous repérez une vulnérabilité, signalez immédiatement

### Données sensibles

| Type de données | Gestion |
|-----------------|---------|
| Données de santé (`isRqth`) | Nécessite une attention particulière - Article 9 RGPD |
| Identifiants personnels | Protection DCP standard |
| Clés API / credentials | Jamais dans le code, toujours en variables d'env |

---

## Sensibilisation aux lacunes critiques

En tant que nouveau membre de l'équipe, soyez conscient de ces points de sécurité :

| Sujet | Statut | Action |
|-------|--------|--------|
| Réponse aux incidents | ✅ Couvert | Politique Plateforme Inclusion - escalader au RSSI |
| Données de santé (RQTH) | ⚠️ En cours | Soyez prudent avec l'accès au champ `isRqth` |
| AIPD | ✅ Validée | Analyse d'Impact validée le 2026-01-28 |
| Hébergement | ✅ SecNumCloud | Zone osc-secnum-fr1 (pas HDS) |

**En cas d'incident de sécurité** : Escalader immédiatement au RSSI de la Plateforme de l'inclusion.

Voir le [Guide de sécurité](./security.md) pour les détails complets.

---

## Obtenir de l'aide

1. **Consulter la documentation** - README, ADRs, ces guides
2. **Chercher dans les issues existantes** - Quelqu'un a peut-être déjà posé la question
3. **Demander à l'équipe** - Nous sommes là pour aider !
4. **Programmation en binôme** - Idéal pour apprendre le codebase

### Commandes utiles

```bash
# Exécuter les tests
pnpm test

# Exécuter la vérification de types
pnpm typecheck

# Exécuter le linting
pnpm lint

# Exécuter les tests E2E
pnpm --filter playwright test
```

---

## Ressources externes

| Ressource | URL | Description |
|-----------|-----|-------------|
| DSFR | https://www.systeme-de-design.gouv.fr/ | Design System de l'État français |
| Beta.gouv.fr | https://beta.gouv.fr/ | Incubateur de startups d'État |
| Info PMSMP | https://www.service-public.fr/particuliers/vosdroits/F13921 | Documentation officielle PMSMP |

---

## Prochaines étapes

Après avoir terminé ce guide :

1. Configurer votre environnement de développement
2. Parcourir un parcours utilisateur complet
3. Choisir une tâche de démarrage dans les issues GitHub
4. Soumettre votre première PR !

Bienvenue dans l'équipe !

---

*Généré par OpenSecKit v4.0.0*
