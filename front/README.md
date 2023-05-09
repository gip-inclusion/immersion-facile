## Frontend documentation

#### Install

**In root folder**, install all dependencies (also installs the backend dependencies):

```shell
pnpm install
```

#### Run local dev, with faked backend

```shell
pnpm dev
```

#### Run local dev, calling backend

```shell
pnpm dev-http
```

You can typecheck the project with :

```shell
pnpm typecheck
```

If you want to make sure everything is fine before pushing for exemple, you can run :

```shell
pnpm fullcheck
```

The frontend and the backend have some shared code which is located in the `shared` folder.
It is a workspace, used in front and in back

### Créer de nouveaux composants front

Le projet Immersion Facilitée se base sur le [Système de Design de l'État- DSFR](https://www.systeme-de-design.gouv.fr/) via [@codegouvfr/react-dsfr](https://github.com/codegouvfr/react-dsfr).

#### DSFR ou composant maison ?

1. dans la très grosse majorité des cas, si le besoin est suffisamment proche de ce qui est fourni, on voudra implémenter des composants existants via `react-dsfr`.

2. dans des cas plus rare de besoin spécifique au projet, on se permettra de créer un composant dans notre lib `react-design-system/immersionFacile`
   Ces composants ne sont que des composants de présentation (pas de logique liée à l'app - Redux, appels externes, etc) mais peuvent charger du CSS / Sass custom (via Sass to TS)

#### Nommage de classes CSS

Le projet utilise la méthodo BEM pour nommage ses blocks custom, préfixés par `im` + le nom du composant React, le tout en kebab case. Ex : pour le composant `HeroHeader`, le résultat attendu est `.im-hero-header`

Pour les éléments et modifiers, nous utiliserons la syntaxe :
`.my-block__element--modifier`, sans profondeur additionnelle, chaque partie étant en kebab case.

#### Que faire avec le DSFR et comment ? que faire en CSS custom ?

- le DSFR propose un lot de classes utilitaires qu'il faut utiliser en priorité. Ex : `.fr-mt-4w` plutôt que `margin-top: 3rem`.
- on utilise toujours les classes du DSFR et les classes custom enrobés via les utilitaires de `react-dsfr` et `tss-react` `fr.cx()` et (éventuellement) `cx()`. Ex: `cx(fr.cx("fr-mt-4w"), Styles.imageWrapper)`
- si une règle CSS ne trouve pas d'équivalent dans le DSFR, on peut se permettre de la déclarer en CSS ou Sass custom.

### E2E Tests with Cypress

#### Run locally

- à la racine du projet
- `pnpm cypress install` pour installer le binaire de l'app de votre OS
- `pnpm front dev-http` & `pnpm back dev` : Cypress va écouter les requêtes XHR et a donc besoin du serveur back qui tourne et du front en mode HTTP
- `pnpm cypress open` pour lancer l'app et démarrer les tests manuellement (End-to-end testing)

##### Linux prerequisites

```shell
sudo apt-get update && sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

### Open the app

At the root of the project run :

```shell
pnpm cypress
```

### Sass to TS

Sass to TS permet de générer des fichiers TS à partir de fichier Sass. C'est un moyen simple et pratique pour s'assurer que les classes que l'on utilise sont toujours employées et prévenir le dev en cas de faute de frappe, autocomplétion ou changement de naming.

Il s'emploie de la façon suivante :
`pnpm make-styles im-search-page src/app/pages/search/`

Dans cet exemple

- `im-search-page` est le nom du composant (block) que l'on va utiliser (BEM)
- `src/app/pages/search/` est le path contenant(s) le fichier(s) à convertir en TS

Résultat attendu :

- à partir de ce fichier : https://github.com/gip-inclusion/immersion-facile/blob/dev/front/src/app/pages/search/SearchPage.scss
- on obtient un fichier `${fileName}.styles.ts`, soit : https://github.com/gip-inclusion/immersion-facile/blob/dev/front/src/app/pages/search/SearchPage.styles.ts
- qui peut être utilisé via un import par défaut, exemple : https://github.com/gip-inclusion/immersion-facile/blob/dev/front/src/app/pages/search/SearchPage.tsx#L29

### Management de l'état de l'application avec Redux

[Documentation](doc/front/onboarding-management-etat/onboading-management-etat.md)
