# Immersion Facilitée - Vue d'ensemble Produit

> Généré par OpenSecKit v4.0.0 - /osk-discover
>
> **Public cible** : Product Managers, Parties prenantes

---

## Tableau de bord

| Métrique | Valeur |
|----------|--------|
| **Produit** | Immersion Facilitée |
| **Version** | 1.0.0 |
| **Maturité** | Production |
| **Fonctionnalités** | 9 |
| **Composants** | 10 |
| **Intégrations** | 12 |
| **Lacunes critiques** | 1 |
| **Score de santé** | 87/100 |

### Indicateurs de conformité

| Domaine | Applicable | Statut |
|---------|------------|--------|
| RGPD | ✅ Oui | Partiel (AIPD validée, GAP-002 en cours) |
| RGS | ✅ Oui | Conforme |
| RGAA | ✅ Oui | Conforme (DSFR) |
| HDS | ❌ Non requis | N/A |

---

## Vision

Moderniser et dématérialiser entièrement le processus des immersions professionnelles pour les bénéficiaires, les entreprises et les organismes d'accompagnement (France Travail, Missions Locales, Cap Emploi, etc.).

## Proposition de valeur

| Audience | Valeur |
|----------|--------|
| **Pour les utilisateurs** | Processus entièrement dématérialisé : recherche d'entreprises, demande d'immersion, suivi de convention - le tout en ligne |
| **Pour le métier** | Réduction du temps administratif, meilleure traçabilité, amélioration du taux de placement, conformité réglementaire automatisée |

**Différenciateurs** :
- Plateforme unifiée pour tous les acteurs de l'immersion
- Intégration native avec France Travail et ProConnect
- Conformité DSFR (Design System de l'État français)
- Gestion des conventions dématérialisées avec signature électronique
- Annuaire des entreprises accueillant en immersion

## Audience cible

**Principale** : Demandeurs d'emploi et personnes en reconversion professionnelle

**Secondaire** :
- Entreprises et structures d'accueil proposant des immersions
- Conseillers des agences (France Travail, Missions Locales, Cap Emploi)
- Administrateurs de la plateforme

**Anti-personas** (qui n'est PAS concerné) :
- Entreprises ne souhaitant pas accueillir d'immersion
- Personnes sans projet professionnel défini

---

## Identité Produit

| Attribut | Valeur |
|----------|--------|
| **Organisation** | GIP Inclusion |
| **Domaine** | emploi-inclusion |
| **Type** | Application Web |
| **Maturité** | Production |
| **Modèle économique** | Service public |
| **Dépôt** | https://github.com/gip-inclusion/immersion-facile |

## Inventaire des fonctionnalités

| ID | Nom | Statut | Propriétaire | Valeur métier |
|----|-----|--------|--------------|---------------|
| `feat-convention` | Gestion des conventions | Active | core-team | Traçabilité complète, conformité |
| `feat-establishment-search` | Recherche d'entreprises | Active | core-team | Augmentation des demandes |
| `feat-establishment-form` | Inscription des entreprises | Active | core-team | Croissance de l'annuaire |
| `feat-agency-dashboard` | Dashboard Agences | Active | core-team | Efficacité des conseillers |
| `feat-assessment` | Bilans d'immersion | Active | core-team | Mesure des résultats |
| `feat-discussion` | Messagerie | Active | core-team | Amélioration conversion |
| `feat-mini-stage-cci` | Mini-stages CCI | Active | core-team | Extension de l'offre |
| `feat-auth-proconnect` | Auth ProConnect | Active | core-team | Conformité SSO État |
| `feat-auth-ft-connect` | Auth France Travail | Active | core-team | Intégration FT |

---

## Fonctionnalités principales

### 1. Gestion des conventions
Gestion complète du cycle de vie des conventions PMSMP de la création à la fin.
- Création de convention avec formulaire multi-étapes
- Workflow de validation (bénéficiaire, établissement, agence)
- Suivi de statut et notifications
- Génération PDF pour les signatures

### 2. Annuaire des établissements
Annuaire recherchable des entreprises ouvertes aux immersions professionnelles.
- Recherche géographique et par secteur
- Gestion des disponibilités
- Traitement des demandes de contact

### 3. Gestion des agences
Back-office pour les agences prescriptrices (France Travail, Missions Locales, Cap Emploi).
- Interface de validation des conventions
- Statistiques et reporting
- Gestion des utilisateurs

### 4. Authentification
Système d'authentification multi-mode.
- Magic Links pour les bénéficiaires
- ProConnect pour les agents d'agence
- France Travail Connect pour les utilisateurs PE

### 5. Intégration France Travail
Synchronisation bidirectionnelle avec les systèmes France Travail.
- Diffusion des conventions
- Récupération des données bénéficiaires
- Synchronisation des statuts

### 6. Notifications
Système de notification multi-canal.
- Email via Brevo
- SMS pour les mises à jour critiques
- Notifications in-app

### 7. Analytique & Reporting
Business intelligence et métriques.
- Tableaux de bord Metabase
- Statistiques des conventions
- Métriques de performance des agences

### 8. Moteur de recherche
Capacités de recherche full-text et géographique.
- Recherche d'établissements par localisation/secteur
- Correspondance de codes ROME
- Filtrage par disponibilité

### 9. Bilan
Évaluation post-immersion et collecte de retours.
- Retour du bénéficiaire
- Évaluation de l'établissement
- Suivi des résultats

## Indicateurs clés de performance

### KPIs Métier

| KPI | Description | Cible | Suivi |
|-----|-------------|-------|-------|
| Conventions validées | Nombre de conventions d'immersion validées | Croissance continue | Base de données |
| Entreprises inscrites | Nombre d'entreprises dans l'annuaire | Croissance continue | Base de données |
| Taux conversion recherche→contact | % de recherches menant à une demande | Augmentation | Analytics |

### KPIs Techniques

| KPI | Description | Cible | SLA |
|-----|-------------|-------|-----|
| Disponibilité | Uptime de la plateforme | 99.5% | ✅ |
| Temps de réponse API | Latence moyenne des endpoints | <500ms | ✅ |

### KPIs Expérience Utilisateur

| KPI | Description | Cible | Méthode |
|-----|-------------|-------|---------|
| Taux de complétion des conventions | % de conventions démarrées qui sont validées | Augmentation | Funnel analysis |

---

## Roadmap

### Trimestre actuel : Q1 2026

**Thème** : Amélioration de l'expérience utilisateur

**Priorités** :
1. Optimisation des performances de recherche
2. Amélioration du parcours de convention

**Livrables clés** :

| Livrable | Statut | Propriétaire |
|----------|--------|--------------|
| Convention draft sharing | 🟡 En cours | core-team |
| FT Connect user contact details | ✅ Terminé | core-team |

### Roadmap future

| Trimestre | Thème | Éléments clés |
|-----------|-------|---------------|
| Q2 2026 | Intégrations et API | API v3 enhancements, New partner integrations |
| Q3 2026 | Scalabilité | Performance optimizations, Infrastructure improvements |

### Dette technique

| ID | Description | Impact | Priorité | Effort |
|----|-------------|--------|----------|--------|
| `debt-001` | Migration agency kind PE vers FT | Moyen | Moyen | Moyen |
| `debt-002` | Unification des gateways IN_MEMORY | Faible | Faible | Élevé |

---

## Contexte concurrentiel

**Catégorie de marché** : Services publics de l'emploi

| Concurrent | Type | Notre avantage | Leur avantage |
|------------|------|----------------|---------------|
| Processus papier traditionnel | legacy | Entièrement dématérialisé, traçabilité complète | Familiarité pour certains utilisateurs |

**Positionnement** : Immersion Facilitée est le seul service numérique officiel permettant de gérer intégralement le processus d'immersion professionnelle en France, avec une intégration native aux systèmes France Travail et une conformité RGPD garantie.

## Parties prenantes

- **Bénéficiaires** : Demandeurs d'emploi recherchant des immersions professionnelles
- **Établissements** : Entreprises proposant des opportunités d'immersion
- **Agences** : Organisations prescriptrices (France Travail, Missions Locales, Cap Emploi)
- **Validateurs** : Personnel d'agence validant les conventions
- **Back-office** : Personnel administratif gérant la plateforme

## Processus métier

1. **Création de convention** - Le bénéficiaire ou le prescripteur initie une demande de convention
2. **Validation de convention** - Workflow de validation multi-parties
3. **Inscription d'établissement** - Les entreprises s'inscrivent pour proposer des immersions
4. **Demande de contact** - Les bénéficiaires contactent les établissements
5. **Collecte de bilan** - Recueil des retours post-immersion
6. **Onboarding d'agence** - Inscription et configuration de nouvelle agence
7. **Sync France Travail** - Synchronisation des données de convention

---

## Tableau de bord des risques

### Lacunes critiques

| Sévérité | ID | Catégorie | Description |
|----------|-----|-----------|-------------|
| 🔴 CRITIQUE | GAP-002 | Données | Données de santé (RQTH) sans protection renforcée |

### Résumé des lacunes

| Sévérité | Nombre |
|----------|--------|
| Critique | 1 |
| Élevée | 3 |
| Moyenne | 7 |
| Faible | 3 |
| **Résolues** | **4** |

Voir [Guide de sécurité](security.md#lacunes-de-sécurité-critiques) pour les détails.

---

## Sensibilité des données

### Catégories de DCP

| Catégorie | Classification | Rétention | Transfert international |
|-----------|----------------|-----------|-------------------------|
| Données bénéficiaire | Personnel | 2 ans | Non |
| Données de santé (RQTH) | Sensible | 2 ans | Non |
| Données d'authentification | Secret | Session | Non |

### Partage avec tiers

| Tiers | Données partagées | Finalité | DPA |
|-------|-------------------|----------|-----|
| France Travail | Conventions, Identité | Synchronisation | ✅ Signé |
| Brevo | Email, Téléphone | Notifications | ✅ Signé |
| ProConnect | Identité | Authentification | ✅ Signé |

---

*Généré par OpenSecKit v4.0.0*
