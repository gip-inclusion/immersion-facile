# Processus de recette et de mise en production

## 2024/10/31

### Contexte du développement effectué

Afin d'avoir du contexte sur la PR et d'effectuer des tests pertinents en recette :

- renseigner systématiquement le numéro du ticket correspondant dans le titre de la PR et idéalement lier la PR au
  ticket
- lorsqu'un dev crée une PR sur une feature d'initiative personnelle il crée systématiquement un ticket lorsqu'il s'agit
  d'une feature à tester (pas forcément besoin s'il s'agit d'une PR tech)
- pour créer un ticket, c'est mieux de passer par le Template sauf si c'est hyper trivial. Cela permet de renseigner
  correctement le contexte et le comportement attendu

### Qui fait la recette ?

Les devs préviennent qu'il y a une recette à faire en staging en:

- créant un fil de discussion sur le canal mise en recette sur Discord
- tagguant le PO

Le PO peut alors commencer à recetter.
Si absence du PO, alors tagguer la PM.
Si absence de la PM alors tagguer les UX.

Il est aussi possible qu'il n'y ait que du technique, qui ne nécessite pas de solliciter PO/PM/UX. Dans ce cas les dev
peuvent faire une recette interne.

### Retours sur les tickets en recette

Les retours liés aux tests sont renseignés sur chaque ticket, en commentaire.

Si un ticket est KO:

- le ticket est réouvert et repassé au statut "Développement en cours"
- les raisons de l'échec des tests sont détaillés dans le ticket
- le ticket invalidé est mentionné dans le fil Discord et les devs concernés y sont taggués

Dans tous les cas, que l'échec de validation du ticket soit bloquant ou non, un résumé de la recette est envoyé sur le
fil Discord de la recette avec : "OK pour MEP" ou "KO pour MEP" (en donnant un lien vers le ticket concerné pour pouvoir
aller voir rapidement ce qui a bloqué).

Lorsqu'un ticket est corrigé suite à un retour, il est important que le dev mette un commentaire en reclôturant le
ticket, afin qu'on sache si le retour à été pris en compte et si non pourquoi.

### Qui lance la MEP ?

Ce sont les devs qui lancent la MEP, car il arrive qu'il y ait des actions autres que d'appuyer sur le bouton (par ex :
requête SQL à exécuter).



