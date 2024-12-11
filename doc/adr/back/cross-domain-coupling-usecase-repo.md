# Couplage cross domaine pour les usecase et les repos

## Problématique

- Le couplage cross domaine dans les repos ou dans des queries autonomes hors repo (scripts)
  - une requête SQL ou un ensemble de requêtes SQL d'une même méthode de repo qui utilisent des données cross domaine
  - exemple : le repo establishment qui peut récupérer dans la même requête des données conventions et établissements
- Le couplage cross domaine des usecase qui peuvent utiliser des repo de plusieurs domaines au lieu de passer par une gateway
  - exemple : la récupération des données utilisateur qui remonte aussi le DTO des agences


## Discussion

- Le couplage cross domaine n'est pas un enjeu majeur d'IF à date:
  - Il n'y a pas un besoin de séparer l'application pour des besoins techniques ou organisationnels sur le long terme
  - Conserver le couplage permet d'executer des requetes optimisées avec des modifications massive en un appel car elle peut lier les tables de l'ensemble de l'application
- Passer en découplé complet à savoir ne pas avoir accès au repo cross domaine et passer par des gateways cross domaine par API n'est pas envisagé car cela rajoute de la sur-optimisation non nécéssaire pour le projet
- Si les enjeux techniques/organisationnels évoluent, ce sujet pourra être rediscuté.

## Décision

- on évite au maximum de faire des requêtes SQL cross domaine dans les repo
- on s'autorise des requêtes SQL cross domaine quand c'est nécéssaire et particulièrement dans des scripts
  - c'est beaucoup plus simple à gérer que de récupérer de la données cross domaine dans les usecases
- les usecase d'un domaine peuvent utiliser des repos d'autres domaines