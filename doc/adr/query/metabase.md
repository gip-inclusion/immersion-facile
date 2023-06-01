# 2023-02-24 - Metabase

Documentation metabase

https://www.metabase.com/docs/latest/

# Options

Hosté

- Scalingo (https://doc.scalingo.com/platform/getting-started/getting-started-with-metabase)
  - https://github.com/Scalingo/metabase-scalingo
    - Buildpacks :
      - https://github.com/Scalingo/buildpack-jvm-common
      - https://github.com/metabase/metabase-buildpack
- Clevercloud (https://www.clever-cloud.com/blog/engineering/2019/02/20/how-to-install-metabase/)

Managé:

- [metabase.com](http://metabase.com) (https://www.metabase.com/pricing/)
- empreinte digitale ?

Canaux d’informations préalables

### Extrait conversation avec @Jérémy Buget (discord)

Jérémy — Yesterday at 11:21 AM
pour Metabase, ça dépend beaucoup et profondément de l'usage que vous souhaitez en faire

- si l'instance a pour but d'être "monétisée" (au sens, on partage des tableaux de bords à un sponsor, une frange d'utilisateurs), alors il faut pour des raisons de sécurité, RGPD, autonomie que vous ayiez votre propre instance
- si ce n'est que pour du debug ou de l'usage exclusivement interne (ex : KPI, suivi de projet), alors on peut se permettre d'avoir une instance mutualisée

le problème du mutualisé, c'est le risque lié à :

- défaut de la plateforme -> impact sur plusieurs services exposés, qui deveinentnet indispo d'un coup
- fuite de données -> impact sur toutes les équipes produit concernés

**je suis en train de formaliser une réflexion par rapport à tout ça (à suivre dans le Notion)** : [Tech](https://www.notion.so/Tech-8d6d87be5c0b47fe8f29c4c6bc13794e)

PS: déployr une instance Metabase dans Scalingo est hyper simple

Hervé — Yesterday at 11:25 AM
nos besoins :

- pouvoir construire des tableaux de bord (pilotage, stats, etc...) en connectant
  - notre base
  - matomo
- les partager comme tu l'indiques.
- très schématiquement : faire comme le pilotage de l'inclusion

**Jérémy :
dans ce cas, je vous recommande de partir sur une instance gérée vous-mêmes sur Scalingo**

J'ai aussi une stratégie sur les services gérés dans le PaaS VS. les services (mutualisés) gérés via Empreinte Digitale ou self-hosted

- si c'est cœur de métier / sponsorisé / critique pour la viabilité du service → au plus proche de votre infra (Scalingo, Clever, Kubernetes, whatever)
- si c'est un outil de support ou productivité qui n'impacte "que" l'équipe → on peut faire héberger par un partenaire ou l'héberger nous-mêmes sur un infra autre
  ex :
- Metabase avec des boards partagés -> Scalingo
- Metabase pour du debug ou de la BI interne -> n'importe qui
- Sendinblue pour du transactionnel -> compte propre à l'appli
- Sendinblue pour du marketing -> compte mutualisé pour le GIP (ça évite les redites et le spam, ça évite aux users transactionnels de se faire spammer, et en cas de futie de secret, ça protège les users)
- Mattermost -> Empreinte Digitale (ED)
- Jitsi -> ED
- Bitwarden -> ED

**REX avec Vermeer - Aide au paramétrage Métabase :**

// TODO

# [Resolu] Questions ouvertes à résoudre avant de prendre une décision :

### Persistence des données et surtout des configurations (requetes pour la visualisation) ?

- Je n’ai pas vu dans les solutions proposées de partie qui en parlent, étant donné la nature dockerisée je pense que ce n’est pas pris en compte. ⇒ Prouvé faux par la lecture de documentation
- On voit qu’il est déja douloureux d’abandonner la partie métier sur Graphana pour reproduire.
- C’est important car si ce n’est pas présent il y a un fort vendor lock-in et une difficultée à bouger ou reproduire l’existant

[Vendor lock-in - Wikipedia](https://en.wikipedia.org/wiki/Vendor_lock-in)

**⇒ (Romain) Tout est apparement stocké dans la base liée à l’application (**https://www.metabase.com/docs/latest/installation-and-operation/backing-up-metabase-application-data**) donc faire un backup de la base liée au métabase fait le travail.\*\*

### Ordre de prix des solutions ?

Managé (80€ mensuels) :

- [Metabase.com :](http://Metabase.com) https://www.metabase.com/pricing/

Hosté :

- Clevercloud ( prob < 50€ mensuel démarrage):

  - Nécessite un runtime Java (https://www.clever-cloud.com/pricing/#Java)
  - avec un addon-postgre (https://www.clever-cloud.com/pricing/#PostgreSQL)

- Scalingo ( prob < 50€ mensuel démarrage):
  - Estimation basée sur les buildpack
    - https://github.com/Scalingo/buildpack-jvm-common
    - https://github.com/metabase/metabase-buildpack
  - et https://scalingo.com/pricing

On peut demander a d’autres SE leur expérience :

- Carnet de bord
- Conseiller numérique
- Autre ?

**⇒ (Romain) Au vu de la réponse sur la persistence des données il me semble intéressant de partir sur la solution Scalingo comme proposé par Jérémy c’est probablement le meilleur rapport simplicité / prix.**

### Compliance RGPD

- https://www.metabase.com/docs/latest/installation-and-operation/privacy

**⇒ (Romain) Par mesure de simplicité l’option la plus conservatrice est de ne pas utiliser le service cloud**
