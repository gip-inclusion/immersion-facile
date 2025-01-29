# Gestion des données statiques à injecter en base de données

## Problématique

- Définir une façon standard pour injecter les données statiques en base

## Discussion

- Historiquement les référentiels externes étaient injectés en base au travers de fichiers statiques stockés dans le repo dans `back/src/config/pg/static-data`
- Dernièrement Benjamin à mis à jour la structure des données du référentiel NAF en spécifiant les données à injecter directement dans le fichier de migration
  - Le fichier de migration est trop gros et manque de lisibilité vu la quantité de données injectés


## Décision
- Toute nouvelle modificiation des données statiques en base doivent stocker les données statique dans un fichier de données (CSV,.sql,json,...) stocké dans `back/src/config/pg/static-data`
- Les scripts de migration peuvent consommer ces fichiers de donnée en utilisant les utilitaires JS/TS pour parser les données.

