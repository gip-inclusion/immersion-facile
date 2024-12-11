# La création systématique de usecases dans le back pour des besoin de documentation automatique

## Problématique

- La création systématique de usecase et d'un fichier de test unitaire même pour un usecase de query très basique à des fins de documentation fonctionnelle pour tout les membres de l'équipe dont les non-techs
  - un POC de documentation de feature par un rapport de test a été transmi au PO et aux UX pour voir si ça leur est utile: https://github.com/gip-inclusion/immersion-facile/issues/2537

## Discussion

- Echanges avec Gael et Elodie à propos d'une documentation des fonctionnalités et éventuellement des parcours de l'application
  - intéret remonté malgré un constat que les fonctionnalités unitaires de l'appli (usecase) sont un peut trop unitaires pour les métier de PO/UX
  - Idéalement une documentation des parcours est demandée
- Beaucoup de questions sont posées sur le fonctionnement des fonctionnalités mais il n'y a pas de documentation
  - Les devs sont référents et responsable de porter/rappeler les règles d'usage des fonctionnalités
- Les ébauches de parcours ne mettent pas / peu l'usage de fonctionnalités
  - pas d'information clair sur les fonctionnalités existantes à faire évoluer ou fonctionnalités manquantes à créer
- Les fonctionnalités ne sont pas toutes représentées par des usecase mais la majorité le sont
  - Les fonctionnalités "techniques", les queries et les scripts sont le plus souvent les fonctionnalités qui n'ont pas de usecase
- Les parcours sont en partie validés par des tests e2e
  - playwright pour une validation complète en utilisant le front (IHM), le back (API) et la DB
  - jest avec les tests e2e pour une validation rapide mais utilisant que le back (API) et les repo en mémoire
- Pour nos queries, souvent on ne crée pas de use case
- Que pensez vous de créer obligatoirement un use case pour toutes les features
  même les queries très simples dans un but de documentation ?
- La documentation manuelle des fonctionnalité n'est pas envisagée car elle demande une maintenance trop lourde pour les devs
  - Jest (et peut être playwright) peuvent être utilisé avec leur système de reporting pour créer une documentation des fonctionnalités en partant des tests
    - Cette fonctionnalité peut être incluse dans 
  - Faire plus que la documentation automatisée n'est pas envisagée pour les mêmes raisons de maintenance trop lourde

- Les UX ont remonté aussi la documentation des data structure (type ULM) pour les aider à comprendre les données et leurs relations mais ce n'est pas lié à cette décision

## Décision


- Si le besoin de documentation des fonctionnalités est validée par les PO/UX alors il convient de documenter toutes les fonctionnalités en utilisant une approche de rédaction de documentation automatique. Cela permettra de rédiger rapidement et de mettre à jour la doc au fur et à mesure.
- La rédaction automatisée de documentation se fait en générant des rapports extraits des tests techniques (soit les tests unitaires, soit les tests e2e)
  - La mise en place du reporting automatique sera à faire mais le POC, basé sur les tests unitaires, indique que la génération de rapport peut être:
    - rapide à configurer sur le repo
    - rapide à générer (pre-commit hook pour inclure le rapport autonome dans le repo, voir dans front/public pour y accéder en production (comme la doc api))
- La documentation des parcours nécessite plus de discussions avec PO/UX pour présenter les solutions possibles et avoir leur retour.

