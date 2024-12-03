# Organisation des slices

## Problématique

- certaines actions sont utilisées dans des parcours différents, et sont “dupliquées” (agency dashboard, admin, etc)
- où stocker la donnée récupérée de l’api (ex: un fetchUserSucceeded va alimenter un currentUser dans le state de la
  slice, si plusieurs parcours utilisent ce fetchUserRequested / Succeeded, est-ce qu’il n’y a pas un risque que les
  différents parcours écrasent la même donnée ?)

## Décision

- séparation des slices par domaines : user, agency, establishment, convention, api-consumer
- si besoin, découper en sous-slice (fetch, update, etc) et utiliser le combineReducers
- si besoin, si une slice a besoin d’écouter l’action d’une autre slice, on peut utiliser un extraReducer
- les actions peuvent être nommées Requested, Succeeded, Failed
- ne plus avoir de dossier `core-logic/domain/admin`