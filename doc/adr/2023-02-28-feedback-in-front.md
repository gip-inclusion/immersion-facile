# Comment gérer les feedbacks aux utilisateurs dans le front ?

## Problématiques

- Les feedbacks sont gérés pour chacun des use case dans le front. Par exemple, dans `agencyAdmin`, ou `convention.slice`
  La logique se répète dans chacune des slices, alors qu'elle est très similaire.

- Pas de moyen de pousser facilement des notifications simples (type "votre action a bien été prise en compte" ou "une erreur est survenue")
  (on pourrait envisager des Toasts, ou autre)

## Conclusion du jour

- On a pas eu tellement de plainte d'utilisateurs comme quoi l'application manque de feedbacks aux utilisateurs.
- Donc on dépriorise la gestion de toaster ou autre pour l'instant.
- On s'autorise a faire un POC pour la mutualisation de feedback coté redux. Afin de voir la faisabilité et que cela répond aux problématiques mentionnées ci-dessus. Il faudra bin s'assurer de l'absence d'effets de bords imprévus et que la gestion reste simple pour les développeurs.

**Décision prise à l'unanimité**
