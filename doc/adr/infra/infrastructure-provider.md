# Infrastructure Provider

## Status : 2023-02-24 - ???????

## Description

Choix d'infrastructure

### 2023-02-24 - Services actuels

- Back : node
- Front : node
- BDD : postgres + adminer
- Scripts : node
- Monitoring : grafana
- C.I : gitlab (??)

### 2023-02-24 - Cahier des charges

#### MUST HAVE (ce qu'on a déjà)

- Une prod, une staging et une dev qui fonctionne
- Des scripts qui tournent
- Adminer et Grafana métier à jour
- C.I et C.D qui se déclanchent
- Backups pour les BDDs
- Pouvoir relancer les services nous-mêmes
- Monitoring des services et alertes (comme sur Grafana aujourd'hui)
- Pouvoir consulter les logs

#### NICE TO HAVE (ce qui nous motive à migrer)

- Autonomie : Pouvoir relancer les instances (ne pas être pas être bloqué par un intermédiaire)
- Features-Branche : Pouvoir déployer des branches en cours afin de tester les fonctionnalités en cours
  - indépendance des cycles de vie des features
  - permet de prévalider l'acceptance avec le métier
- Faire des copies à la volée
- Backups automatisées
- Recovery Time Objective : temps du pipe

---

## Context

### 2023-02-24 - Actuellement chez PE

- On souffre de la dépendance PE
- On souffre de l'automatisation (CI longue)

#### Pour

- On y est, et ça marche (à peu près)

#### Contre

- pas la main pour la gestion des machines
- pas de reporting sur les machines elles même
- pas de monitoring et / ou diffcile à mettre en place
- pas de SRE automatisé
- pas de backups automatisés
- pas de load balancing automatisé
- pas simple de cloner des instances pour des tests
- pas de branche de feature
- limitation de la mémoire pour les services
- pas d'auto- heal des noeuds
- Pas de processus automatisé de déploiement ‘from scratch’ donc en cas de crash dur de la production nous n’avons pas d’experience sur notre RTO (Return To Online)

### 2023-02-24 - Alternatives

- Scalingo : PAAS (plateform as a service). Choix poussé par Beta.
- Clevercloud : PAAS (plateform as a service)
- Scaleway : IAAS (infra as a service) => IAC (Infrastructure As Code: eg Terraform)
- K8s auto-managé. Pas les compétences en interne.

---

## Decision

### 2023-02-24 - Next steps

- Présentation/Démo de ce qui a déjà été fait
- Explication du graphe suivant :
  !https://storage.gra.cloud.ovh.net/v1/AUTH_0f20d409cb2a4c9786c769e2edec0e06/imagespadincubateurnet/uploads/upload_37ba45dc4d752598a79306737ebeb89e.png
- Rédaction des journées (stratégie long terme)
- Attribution des rôles

---

## Consequences

---

## Annexes

### 2023-02-24 - Détails additionnels sur les Paas BetaGouv

Clever compile ses propres images Unix/Linux. ils arrivent à booter une VM en 7 sec. Ils ont leur propre orchestrateur. Comme Scalingo (en Go). Clever n'utilise pas la spec Buildpack. Scalingo oui, ce qui les rend compliant Heroku.

[5 septembre 2022 15:05](https://mattermost.incubateur.net/betagouv/pl/5za48ss6etdo388immqca6bm3a)

après, à titre perso, je trouve que Clever est plus bling-bling que Scalingo. en termes d'UX, j'ai pas mal joué avec les 2 (que je soutiens niveau cloud souverain), mais je préfère Scalingo. même si en vrai, je m'en fiche un peu des IHM. je préfère les API et tout l'outillage autour.

[5 septembre 2022 15:06](https://mattermost.incubateur.net/betagouv/pl/mdtgwa8fhjfbtdeimooiyohnkc)

Clever détiennent leurs propres serveurs. Scalingo s'appuie sur 3DS Outscale (la filliale Cloud de Dassault qui s'est lancé dans le cloud public depuis 3-5 ans)

[5 septembre 2022 15:07](https://mattermost.incubateur.net/betagouv/pl/d9uo4qrp5jf9i8auwdizod439e)

Les limites de Scalingo sont pour beaucoup celles de Outscale (cf. l'object storage, qu'ils préfèrent ne pas ouvrir). Celle de Clever, sont celles de leur infra (mais du coup, ils partent de plus loin en termes d'homologations et certif)
