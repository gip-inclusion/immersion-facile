# Gestion des vulnérabilités des dépendances PNPM

Piste pour assurer des versions minimums sur les sous-dépendances.

```
{
    "pnpm": {
        "overrides": {
            "lodash@<2.1.0": "^2.1.0"
        }
    }
}
```

- https://blog.logto.io/pnpm-upgrade-transitive-dependencies
- https://pnpm.io/cli/audit
- https://pnpm.io/cli/outdated

## Proposition commune

Mettre en place une procédure en cas de vulnérabilité constatée afin de ne plus l'avoir.

## Procédure

- identifier les deps en vulnérabilité et la version qui fix la vulnérabilité
  - dependabot sur github
  - rapport `pnpm audit`
- identifier la dep installée dans le projet qui utilise la dep en vulnérabilité avec

  `pnpm why -r <nom-dep-vulnerable>`

- Avant de prendre une décision il est important de mesurer le risque dans le contexte IF au delà du niveau de criticité.

  > Exemple : une vulnérabilité liée à une dependance principale qui s'occupe des tests n'est pas pertinente. Par contre une vulnérabilité liée au runtime front/back est plus prioritaire.

  > En cas de doutes voir avec le RSSI de la plateforme de l'inclusion.

- 4 choix possibles sur la dépendance principale explicitement précisée dans les package.json des workspaces à choisir par priorité :

  1. Supprimer la dependance principale car legacy inutile.
  2. Maj la dep principale et voir si la vulnérabilité disparait.
  3. Remplacer la dep principale par une autre dep qui fait le même besoin et voir si la vulnérabilité disparait.
  4. Faire un **overrides** pnpm sur la sous dépendance pour forcer la version minimum qui résoud la vulnérabilité.

  > Attention la dep pourrait ne plus fonctionner correctement. Il vaut mieux appliquer la version qui reste avec la même version majeure (ex : 3.0.3 > 3.2.1 au lieu de choisir 4.0.1) car en règle de versioning on reste normalement retrocompatible.

  > En cas de déclaration d'overrides, il faut lancer `pnpm i` pour mettre à jour le `pnpm.lock` .
