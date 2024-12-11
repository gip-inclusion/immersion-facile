# Les queries qui aggrègent des données cross domaine pour un besoin front

## Problématique


- Les view model (queries) back cross domaines pourraient être abandonnées au profit d'une aggrégation des données côté front
  - exemple : les données utilisateurs qui contiennent les informations détaillées des agences




## Discussion

- Beaucoup de travail d'aggragation serait porté par les clients web et donc pas les utilisateurs.
- La latence pourrait augmenter au détriment des utilisateurs
- Les fonctionnalités de queries cross domain sont portées par les deux domaines
- Les données portent les identifiants uniques des données à récupérer et bien souvent les API back sont déjà développées
- une query back avec un view model en plus c'est une API supplémentaire à développer et à maintenir
  - le faire côté front serait aussi un travail d'aggrégation et de complexification des EPIC redux à faire évoluer et à maintenir


## Décision
- C'est au back de fournir les view model même en cross domaine
  - Une query cross domaine sera portée/rangée dans un des domaines au cas par cas
  - L'augmentation des view model et des query du back pour répondre aux besoins de données front (ou API) est une conséquence et une complexification normale du back

- Le front doit avoir le moins de calcul/complexité possible pour les utilisateurs et limiter au maximum les temps de récupération des données
  - Si un modèle de donné n'est pas disponible dans les API du back, ce n'est pas au front de faire la logique d'aggrégation mais au back de fournir une API qui fournira le view model adapté

