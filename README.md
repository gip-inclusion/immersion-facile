# Immersion Facile

Le but du projet immersion facile est de faciliter les immersions professionnelles.
Il y pour cela plusieurs axes de travail :

- Dématérialiser entièrement les demandes d'immersion et les interactions des conseillers pôle emploi ou mission locale
- Constituer un annuaire des entreprises qui sont susceptible d'accueillir en immersion
- Rendre les immersions recherchables par les bénéficiaires

### Prérequis

Pour démarrer le projet il vous faut `git`, `docker` et `node` (version > 12 )installée sur la machine.
Nous utilions également `pnpm` comme gestionnaire de paquets (pour l'installer : `npm install -g pnpm`).

### Démarrer le projet

Il faut demander d'être ajouté au projet sur le gitlab de pole-emploi. L'url du projet est la suivante :
[https://git.beta.pole-emploi.fr/jburkard/immersion-facile](https://git.beta.pole-emploi.fr/jburkard/immersion-facile)

Récupérer ou pousser du code sur gitlab, il faut également avoir (ou générer) une paire de clé ssh et **donner la clé public à l'équipe pole-emploi**.
Le but étant de donner les droits sur gitlab et sur la machines de recette.

#### Exemple de création de clé ssh (en général à la racine de l'utilisateur) :

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

#### Cloner le projet :

```sh
git clone ssh://git@git.beta.pole-emploi.fr:23/jburkard/immersion-facile.git immersion-facile;
cd immersion-facile;
```

#### Installer les dépendances nodes

```shell
pnpm install
```

#### Faire une copie du `.env.sample` qui devra s'appeler `.env`:

```sh
cp .env.sample .env
```

#### Jouer le script pour créer les variables d'env du front :

```sh
pnpm generate-front-envfile
```

Le `.env` permet de configurer le mode de fonctionnement de l'application.
Par défaut tous les services sont IN_MEMORY.
On peut lancer avec une base de données postgres simplement en mettant `REPOSITORIES="PG"`.
Le conteneur faisant parti du docker-compose et la PG_URL étant fourni, cela devrait fonctionner sans autre configuration.

Les autres services ont une implémentation IN_MEMORY mais pour fonctionner avec les véritables services il faut fournir les secrets /clés API.
Ce n'est pas censé être nécessaire en local, si jamais c'était le cas, veuillez vous rapprocher de l'équipe.

#### Lancer le projet avec docker-compose

```sh
docker-compose up --build
```

#### Sans docker-compose

Pour utiliser la DB postgres, il faut soit installer postgres sur sa machine, soit lancer postgres dans un container.
Nous avons un docker-compose prévu à cet effet, qui va uniquement rendre une DB postgres disponible (mais ne lancera aucun autre service).

Pour le lancer :

```sh
docker-compose -f docker-compose.resources.yml up --build
```

Pour le backend se référer ensuite ici:
[Documentation backend](./back/README.md)

Pour le frontend se référer ensuite ici:
[Documentation frontend](./front/README.md)

-

### Outillage

#### CLI

##### Husky

Husky sert à automatiser des executions de commandes projet avant les commits et les push (format, lint, test... )
La configuration husky est présente ici [.husky](.husky)  
Documentation locale [.husky.md](.husky/husky.md)  
[Documentation officielle](https://typicode.github.io/husky/#/)

##### Lint-staged

Lint stage permet de ne jouer le lint et le prettier que sur les fichiers qui ont été stage dans Git
La configuration lint-stage est présente ici [.tooling/.lint-staged/.lintstagedrc](.tooling/.lint-staged/.lintstagedrc)
[Documentation officielle](https://github.com/okonet/lint-staged)

#### Turbo

TODO DOC
