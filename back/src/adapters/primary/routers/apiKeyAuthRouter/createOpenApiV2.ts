import { createOpenApiGenerator } from "shared-routes/openapi";
import { publicApiV2Routes } from "./publicApiV2.routes";

const generateOpenApi = createOpenApiGenerator(
  { routesV2: publicApiV2Routes },
  {
    info: {
      title: "Immersion facilitée recherche d’entreprises accueillantes API v2",
      description: `Ceci est la documentation pour consommer l’api d’immersion facilité.
      Une clé API est nécessaire pour utiliser l’api. Veuillez vous mettre en contact avec l’équipe d’immersion facilité pour l’obtenir.
      La clé API est à fournir en authorization header de toutes les requêtes.
      
      ⚠️Attention, cette documentation est encore en cours de construction.
      L'API n'est pas encore disponible à la consommation. ⚠️
      `,
      version: "2",
    },
    servers: [
      {
        url: "/api",
        description: "Url de l'api",
      },
    ],
    openapi: "3.0.1",
  },
);

export const openApiSpecV2 = generateOpenApi({
  routesV2: {
    searchImmersion: {
      summary: "Recherche",
      description:
        "Description : Retourne un tableau d'offres d'immersion correspondant a la recherche",
      extraDocs: {
        queryParams: {
          longitude: {
            example: 52.387783,
            description: "Coordonnées de latitude",
          },
          latitude: {
            example: 9.7334394,
            description: "Coordonnées de longitude",
          },
          rome: {
            example: "D1102",
            description: "Code ROME à 1 lettre et 4 chiffres",
          },
          appellationCode: {
            example: "11573",
            description: "Code appellation à 5 chiffres",
          },
          distanceKm: {
            example: 10,
            description: "Rayon de la recherche en km",
          },
          sortedBy: {
            example: "distance",
            description: "Critère de tri des résultats de recheche",
          },
          voluntaryToImmersion: {
            example: true,
            description: `Valeurs possibles:
              true -> seul nos entreprises référencées seront renvoyées,
              false -> seul les entreprises non référencées seront renvoyées,
              Si ce paramètre n'est pas renseigné toutes les entreprises seront renvoyées`,
          },
        },
        responses: {
          "200": {
            description: "Opération réussie",
          },
          "400": {
            description: "Requête invalide: paramètres d'entrées invalides",
          },
          "401": {
            description: "Utilisateur non authentifié",
          },
          "403": {
            description:
              "Accès non autorisé (veuillez vérifier que vous avez les droits)",
          },
        },
      },
    },
    getOfferBySiretAndAppellationCode: {
      summary: "Récupération d’un résultat connu",
      description: "Description : Renvoie l'offre d'immersion correspondante",
      parameters: [
        {
          name: "siret",
          in: "path",
          required: true,
          schema: { type: "string" },
          description:
            "Siret (14 chiffres) de l'entreprise proposant l'offre d'immersion",
        },
        {
          name: "appellationCode",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Code appellation à 5 chiffres",
        },
      ],
      extraDocs: {
        responses: {
          "200": {
            description: "Opération réussie",
          },
          // TODO
          // "400": {
          //   description: "TODO",
          // },
          "401": {
            description: "Utilisateur non authentifié",
          },
          "403": {
            description:
              "Accès non autorisé (veuillez vérifier que vous avez les droits)",
          },
          "404": {
            description: "Résultat non trouvé",
          },
        },
      },
    },

    contactEstablishment: {
      summary: "Mise en contact",
      description: `Description : Vous devez fournir le mode de contact qui a été renseigné par l’entreprise (dans les résultats de recherche). Ce qui se passe:
      
      EMAIL : L’entreprise va recevoir le message du candidat par email et c’est la responsabilité de l’entreprise de recontacter le candidat (le mail du candidat est fourni à l’entreprise).
      
      PHONE : Dans le cas téléphone le candidat va recevoir un email avec le téléphone de la personne à contacter dans l’entreprise.
      
      IN_PERSON : Dans le cas en personne le candidat reçoit un email avec le nom de la personne, et l’addresse de l’entreprise et doit se présenter en personne.`,
      extraDocs: {
        body: {
          properties: {
            //TODO
          },
        },
        responses: {
          "201": {
            description: "Opération réussie",
          },
          "400": {
            description: "Le mode de contact ne correspond pas",
          },
          "401": {
            description: "Utilisateur non authentifié",
          },
          "403": {
            description:
              "Accès non autorisé (veuillez vérifier que vous avez les droits)",
          },
          "404": {
            description: "Établissement/Contact non trouvé",
          },
        },
      },
    },
  },
});
