# Immersion Facilitée - Guide du développeur

> Généré par OpenSecKit v4.0.0 - /osk-discover
>
> **Public cible** : Développeurs

---

## Tableau de bord

| Métrique | Valeur |
|----------|--------|
| **Composants** | 10 |
| **APIs** | 3 |
| **Intégrations** | 12 |
| **Termes du glossaire** | 16 |
| **Stack technique** | TypeScript 5.8, React 18, Express.js, PostgreSQL 13 |

---

## Structure du projet

```
immersion-facile/
├── front/                 # Application frontend React
│   ├── src/
│   │   ├── app/          # Store Redux, routes
│   │   ├── core-logic/   # Logique métier, slices
│   │   └── uiComponents/ # Composants React
│   └── package.json
├── back/                  # Backend Express.js
│   ├── src/
│   │   ├── adapters/     # Adaptateurs d'infrastructure
│   │   ├── config/       # Configuration
│   │   └── domains/      # Modules domaine
│   │       ├── convention/
│   │       ├── establishment/
│   │       ├── agency/
│   │       ├── inclusion-connected-users/
│   │       └── core/
│   └── package.json
├── shared/                # Types TypeScript partagés
│   └── src/
│       ├── convention/   # DTOs Convention
│       ├── establishment/
│       ├── agency/
│       └── ...
├── libs/                  # Bibliothèques internes
│   ├── react-design-system/  # Composants DSFR
│   └── html-templates/       # Templates d'emails
├── playwright/            # Tests E2E
└── package.json          # Workspace racine
```

## Démarrage

### Prérequis

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 13+ (via Docker)

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/gip-inclusion/immersion-facile.git
cd immersion-facile

# Installer les dépendances
pnpm install

# Démarrer l'infrastructure (PostgreSQL, Redis)
docker-compose up -d

# Exécuter les migrations
pnpm --filter back db:migrate

# Alimenter la base de données
pnpm --filter back db:seed

# Démarrer les serveurs de développement
pnpm dev
```

### Variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/immersion

# Redis
REDIS_URL=redis://localhost:6379

# Authentification
JWT_ES256_PRIVATE_KEY=...
JWT_ES256_PUBLIC_KEY=...
MAGIC_LINK_SECRET=...

# APIs externes
FRANCE_TRAVAIL_CLIENT_ID=...
FRANCE_TRAVAIL_CLIENT_SECRET=...
BREVO_API_KEY=...
```

## Workflow de développement

### Stratégie de branches

- `main` - Branche de production
- Branches de fonctionnalité depuis `main`
- Workflow basé sur les PR avec revues obligatoires

### Commandes

```bash
# Développement
pnpm dev              # Démarrer tous les services
pnpm --filter front dev   # Frontend uniquement
pnpm --filter back dev    # Backend uniquement

# Tests
pnpm test             # Exécuter tous les tests
pnpm --filter back test   # Tests backend
pnpm --filter front test  # Tests frontend
pnpm e2e              # Tests E2E Playwright

# Linting & Formatage
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # TypeScript

# Base de données
pnpm --filter back db:migrate    # Exécuter les migrations
pnpm --filter back db:rollback   # Annuler une migration
pnpm --filter back db:seed       # Alimenter les données
```

### Règles de revue de code

Voir `doc/adr/dev-process-PR.md` pour les consignes détaillées.

- Minimum 1 approbation requise
- Tous les checks CI doivent passer
- Messages de commit descriptifs
- PRs petites et focalisées préférées

## Principes d'architecture

### Architecture Hexagonale

```mermaid
flowchart TB
    subgraph Domain["Couche Domaine"]
        Entities["Entités"]
        UseCases["Cas d'utilisation"]
        Ports["Ports"]

        Entities <--> Ports
        UseCases <--> Ports
    end

    subgraph Adapters["Couche Adaptateurs"]
        Primary["Adaptateurs Primaires<br/>(HTTP, CLI)"]
        Secondary["Adaptateurs Secondaires<br/>(BDD, APIs)"]
    end

    Primary --> Ports
    Ports --> Secondary

    style Domain fill:#fff3e0,stroke:#ff9800
    style Entities fill:#ffe0b2
    style UseCases fill:#ffe0b2
    style Ports fill:#ffcc80
    style Adapters fill:#e3f2fd,stroke:#2196f3
    style Primary fill:#bbdefb
    style Secondary fill:#bbdefb
```

- **Domaine** : Logique métier, entités, cas d'utilisation
- **Ports** : Interfaces définissant les contrats
- **Adaptateurs** : Implémentations (HTTP, BDD, APIs externes)

### Ajouter une nouvelle fonctionnalité

1. Définir les types dans `shared/src/<domaine>/`
2. Créer le cas d'utilisation dans `back/src/domains/<domaine>/use-cases/`
3. Implémenter les ports dans `back/src/domains/<domaine>/ports/`
4. Créer les adaptateurs dans `back/src/domains/<domaine>/adapters/`
5. Ajouter la route HTTP dans `back/src/adapters/primary/routers/`
6. Créer les composants frontend dans `front/src/`
7. Ajouter des tests à chaque couche

### Événements domaine

Les événements sont publiés via le pattern transactional outbox :

```typescript
// Dans le cas d'utilisation
await uow.outboxRepository.save({
  topic: "ConventionCreated",
  payload: { conventionId },
});

// L'event crawler traite et publie
```

## Stratégie de test

### Tests unitaires

- Emplacement : `*.unit.test.ts`
- Framework : Vitest
- Couverture : Logique domaine, cas d'utilisation

### Tests d'intégration

- Emplacement : `*.integration.test.ts`
- Framework : Vitest
- Base de données : Instance PostgreSQL de test

### Tests E2E

- Emplacement : `playwright/`
- Framework : Playwright
- Portée : Parcours utilisateur critiques

## Vue d'ensemble des composants

| Composant | Type | Technologie | Emplacement |
|-----------|------|-------------|-------------|
| **Frontend** | web-application | React 18, Vite, Redux | `front/` |
| **Backend API** | api-server | Express.js, Kysely, Node.js 22 | `back/` |
| **Shared Library** | library | TypeScript, Zod | `shared/` |
| **PostgreSQL** | database | PostgreSQL 13, PostGIS | managed-service |
| **Redis Cache** | cache | Redis | managed-service |
| **Background Jobs** | worker | Node.js | `back/src/scripts/` |
| **Event Crawler** | worker | Node.js | `back/src/domains/core/events/` |
| **HTML Templates** | library | TypeScript | `libs/html-templates/` |
| **React Design System** | library | React | `libs/react-design-system/` |
| **Adminer** | admin-tool | PHP | managed-service |

Voir [Guide d'architecture](architecture.md#composants) pour les détails.

---

## Référence API

| Nom | Type | Base Path | Auth | Documentation |
|-----|------|-----------|------|---------------|
| **API Principale** | REST | `/api` | JWT, Magic Links, API Keys | `/api/swagger` |
| **API Partenaires v2** | REST | `/api/v2` | API Key | `/api/v2/docs` |
| **API Partenaires v3** | REST | `/api/v3` | API Key | `/api/v3/docs` |

Voir [Guide d'architecture](architecture.md#apis) pour les spécifications détaillées.

---

## Points d'intégration

| Service | Type | Authentification | Endpoint |
|---------|------|------------------|----------|
| **France Travail** | government-api | OAuth2 | `api.francetravail.io` |
| **ProConnect** | authentication | OAuth2/OIDC | `proconnect.gouv.fr` |
| **Brevo** | notification | API Key | `api.brevo.com` |
| **INSEE SIRENE** | government-api | OAuth2 | `api.insee.fr` |
| **S3 (Cellar)** | storage | AWS credentials | Scalingo Cellar |

Voir [Guide d'architecture](architecture.md#data-flow-diagram-dfd) pour les flux de données.

---

## Environnements

| Nom | Type | URL | Accès |
|-----|------|-----|-------|
| **Local** | development | http://localhost:3000 | Développeurs |
| **Review** | review | Dynamique par PR | Équipe |
| **Staging** | staging | https://staging.immersion-facile.beta.gouv.fr | Équipe |
| **Production** | production | https://immersion-facile.beta.gouv.fr | Public |
| **Pentest** | pentest | https://pentest.immersion-facile.beta.gouv.fr | Bug bounty |

Voir [Guide des opérations](operations.md#environnements) pour la configuration détaillée.

---

## Concepts clés du domaine

| Terme | Description |
|-------|-------------|
| **Convention** | Accord PMSMP entre bénéficiaire, établissement et agence |
| **Établissement** | Entreprise proposant des opportunités d'immersion |
| **Agence** | Organisation prescriptrice (France Travail, Mission Locale, etc.) |
| **Bénéficiaire** | Demandeur d'emploi participant à l'immersion |
| **SIRET** | Identifiant d'entreprise français (14 chiffres) |
| **ROME** | Code de classification des métiers français |

Voir [glossary.yaml](../system-model/glossary.yaml) pour le vocabulaire complet.

## Dépannage

### Problèmes courants

**Erreurs de connexion à la base de données**
```bash
docker-compose up -d  # S'assurer que PostgreSQL tourne
```

**Erreurs de type après un pull**
```bash
pnpm install  # Réinstaller les dépendances
pnpm typecheck  # Vérifier les types
```

**Échecs de tests**
```bash
pnpm --filter back db:migrate  # S'assurer que les migrations sont à jour
```

## Équipe & Contacts

| Rôle | Contact |
|------|---------|
| **Tech Lead** | core-team |
| **Platform Team** | ops-team |
| **Product Team** | product-team |
| **RSSI** | Plateforme de l'inclusion |

### Contact sécurité

| Rôle | Organisation |
|------|--------------|
| Security Champion | RSSI Plateforme Inclusion |

---

## Documentation associée

| Document | Objectif |
|----------|----------|
| [Guide d'architecture](architecture.md) | Architecture détaillée, diagrammes |
| [Guide de sécurité](security.md) | Contrôles de sécurité, frontières de confiance |
| [Guide des opérations](operations.md) | Procédures opérationnelles, runbooks |
| [Guide d'intégration](onboarding.md) | Guide pour les nouveaux membres |

---

## Ressources

- [README.md](../../README.md) - Vue d'ensemble du projet
- [ADRs](../../doc/adr/) - Architecture Decision Records
- [Documentation API](../../doc/api/) - Spécifications OpenAPI

---

*Généré par OpenSecKit v4.0.0*
