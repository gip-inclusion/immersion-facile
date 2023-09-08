import { ConventionDtoBuilder, SearchResultDto } from "shared";
import { createOpenApiGenerator } from "shared-routes/openapi";
import { ContactEstablishmentPublicV2Dto } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import {
  publicApiV2ConventionRoutes,
  publicApiV2SearchEstablishmentRoutes,
} from "./publicApiV2.routes";

const contactByEmailExample: ContactEstablishmentPublicV2Dto = {
  potentialBeneficiaryFirstName: "John",
  potentialBeneficiaryLastName: "Doe",
  potentialBeneficiaryEmail: "john.doe@mail.com",
  appellationCode: "11573",
  siret: "12345678912345",
  contactMode: "EMAIL",
  message: "Mon message",
  potentialBeneficiaryPhone: "0123456789",
  immersionObjective: "Découvrir un métier ou un secteur d'activité",
};

const contactByPhoneExample: ContactEstablishmentPublicV2Dto = {
  potentialBeneficiaryFirstName: "John",
  potentialBeneficiaryLastName: "Doe",
  potentialBeneficiaryEmail: "john.doe@mail.com",
  appellationCode: "11573",
  siret: "12345678912345",
  contactMode: "PHONE",
};

const contactInPersonExample: ContactEstablishmentPublicV2Dto = {
  potentialBeneficiaryFirstName: "John",
  potentialBeneficiaryLastName: "Doe",
  potentialBeneficiaryEmail: "john.doe@mail.com",
  appellationCode: "11573",
  siret: "12345678912345",
  contactMode: "IN_PERSON",
};

const searchImmersionResult: SearchResultDto = {
  additionalInformation: "Some additional information",
  address: {
    departmentCode: "75",
    postcode: "75001",
    streetNumberAndAddress: "1 rue de Rivoli",
    city: "Paris",
  },
  rome: "B1805",
  romeLabel: "Stylisme",
  appellations: [
    {
      appellationCode: "19540",
      appellationLabel: "Styliste",
    },
    {
      appellationCode: "12831",
      appellationLabel:
        "Concepteur / Conceptrice maquettiste en accessoires de mode",
    },
  ],
  contactMode: "EMAIL",
  customizedName: "Ma super boite",
  distance_m: 1225,
  fitForDisabledWorkers: false,
  naf: "123",
  nafLabel: "Fabrication de vêtements",
  name: "Raison sociale de ma super boite",
  numberOfEmployeeRange: "",
  position: {
    lat: 48.8589507,
    lon: 2.3468078,
  },
  siret: "11110000222200",
  voluntaryToImmersion: true,
  website: "www.masuperboite.com",
};

const withAuthorizationHeader = {
  authorization: {
    description:
      "La clé API à fournir. (Pas besoin de 'Bearer xxx', juste 'xxx')",
    example: "my-jwt-token",
  },
};

const apiKeyAuth = "apiKeyAuth";

const searchSection = "Recherche d'entreprise accueillante et mise en contact";
const conventionSection = "Accès aux conventions";

const getServers = (envType: string) => {
  if (envType === "production") {
    return [
      {
        url: "https://staging.immersion-facile.beta.gouv.fr/api",
        description: "Staging",
      },
      {
        url: "https://immersion-facile.beta.gouv.fr/api",
        description: "Production",
      },
    ];
  }
  return [
    {
      url: "/api",
      description: envType,
    },
  ];
};

const generateOpenApi = (envType: string) =>
  createOpenApiGenerator(
    {
      [searchSection]: publicApiV2SearchEstablishmentRoutes,
      [conventionSection]: publicApiV2ConventionRoutes,
    },
    {
      info: {
        title: "Les API Immersion facilitée",
        description: `Ceci est la documentation pour consommer l’api d’immersion facilitée.
      Une clé API est nécessaire pour utiliser l’api. Veuillez vous mettre en contact avec l’équipe d’immersion facilitée pour l’obtenir.
      Vous aurez à préciser ce dont vous avez besoin :
      <ul>
      <li>la partie recherche d’entreprise</li> 
      <li>la partie accès aux conventions (dans ce cas il nous faudra connaître les agences qui vous concernent)</li>
      </ul>
     La clé API est à fournir en authorization header de toutes les requêtes.
      `,
        version: "v2",
      },
      servers: getServers(envType),
      openapi: "3.1.0",
      security: [{ [apiKeyAuth]: [] }],
      components: {
        securitySchemes: {
          [apiKeyAuth]: {
            type: "apiKey",
            in: "header",
            name: "authorization",
            description:
              "Une clé api est nécessaire pour utiliser l’api. Veuillez contacter immersion facilitée si vous souhaitez l’obtenir.",
          },
        },
      },
    },
  );

const error401Example = {
  status: 401,
  message: "unauthenticated",
};
const error403Example = {
  status: 403,
  message: "unauthorized consumer Id",
};
const error404Example = {
  status: 404,
  message: "No establishment found with siret 12345678912345",
};

export const createOpenApiSpecV2 = (envType: string) =>
  generateOpenApi(envType)({
    [searchSection]: {
      searchImmersion: {
        summary: "Recherche",
        description:
          "Retourne un tableau d'offres d'immersion correspondant à la recherche",
        extraDocs: {
          headerParams: withAuthorizationHeader,
          queryParams: {
            longitude: {
              example: 2.34839,
              description: "Coordonnées de latitude",
            },
            latitude: {
              example: 48.8535,
              description: "Coordonnées de longitude",
            },
            rome: {
              example: "D1102",
              description: "Code ROME à 1 lettre et 4 chiffres",
            },
            appellationCodes: {
              example: ["11573", "38444"],
              description: "Tableau de codes appellation à 5 chiffres",
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
              allowEmptyValue: true,
              examples: {
                true: {
                  summary:
                    "Entreprises référencés chez Immersion Facilitée uniquement",
                  value: true,
                  description:
                    "Seules nos entreprises référencées seront renvoyées",
                },
                false: {
                  summary: "Entreprises non-référencées uniquement",
                  value: false,
                  description:
                    "Seules les entreprises non-référencées seront renvoyées (celles qui viennent de La Bonne Boite)",
                },
                notDefined: {
                  summary: "Les entreprise référencées avec compléments",
                  value: undefined,
                  description:
                    "Si ce paramètre n'est pas renseigné toutes les entreprises seront renvoyées",
                },
              },
              description: `Voulez-vous uniquement les entreprises référencées par immersion facilitée ?`,
            },
          },
          responses: {
            "200": {
              description: "Opération réussie",
              example: [searchImmersionResult],
            },
            "400": {
              description: "Requête invalide: paramètres d'entrées invalides",
              example: {
                status: 400,
                message:
                  "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /v2/contact-establishment",
                issues: ["siret : SIRET doit être composé de 14 chiffres"],
              },
            },
            "401": {
              description: "Utilisateur non authentifié",
              example: error401Example,
            },
            "403": {
              description:
                "Accès non autorisé (veuillez vérifier que vous avez les droits)",
              example: error403Example,
            },
          },
        },
      },
      getOfferBySiretAndAppellationCode: {
        summary: "Récupération d’un résultat de recherche d'immersion connu",
        description:
          "Renvoie l'offre d'immersion correspondante. N'est possible que dans le case d'une immersion référencée par Immersion Facilitée (c'est à dire avec `volontaryToImmersion` à `true`). " +
          "Les établissements peuvent également être supprimés et les métiers peuvent évoluer. Dans ce cas il y aura un retour 404.",
        extraDocs: {
          headerParams: withAuthorizationHeader,
          urlParams: {
            siret: {
              description:
                "Siret (14 chiffres) de l'entreprise proposant l'offre d'immersion",
              example: "11110000222200",
            },

            appellationCode: {
              description: "Code appellation à 5 chiffres",
              example: "12001",
            },
          },
          responses: {
            "200": {
              description: "Opération réussie",
              example: searchImmersionResult,
            },
            "400": {
              description: "Dans le cas d'une requête invalide",
              example: {
                status: 400,
                message: "Schema validation failed",
                issues: ["siret: SIRET doit être composé de 14 chiffres"],
              },
            },
            "401": {
              description: "Utilisateur non authentifié",
              example: error401Example,
            },
            "403": {
              description:
                "Accès non autorisé (veuillez vérifier que vous avez les droits)",
              example: error403Example,
            },
            "404": {
              description: "Résultat non trouvé",
              example: error404Example,
            },
          },
        },
      },

      contactEstablishment: {
        summary: "Mise en contact",
        description: `⚠️Vous devez fournir le mode de contact qui a été renseigné par l’entreprise (dans les résultats de recherche) ⚠️. Ce qui se passe:
      
      EMAIL : L’entreprise va recevoir le message du candidat par email et c’est la responsabilité de l’entreprise de recontacter le candidat (le mail du candidat est fourni à l’entreprise).
      
      PHONE : Dans le cas téléphone le candidat va recevoir un email avec le téléphone de la personne à contacter dans l’entreprise.
      
      IN_PERSON : Dans le cas en personne le candidat reçoit un email avec le nom de la personne, et l’adresse de l’entreprise et doit se présenter en personne.`,

        extraDocs: {
          headerParams: withAuthorizationHeader,
          body: {
            examples: {
              email: {
                summary: "Contact par mail",
                description:
                  "Une demande de mise en contact, pour une entreprise devant être contacté par email",
                value: contactByEmailExample,
              },
              phone: {
                summary: "Contact par téléphone",
                description:
                  "Une demande de mise en contact, pour une entreprise devant être contacté par téléphone",
                value: contactByPhoneExample,
              },
              inPerson: {
                summary: "Contact en personne",
                description:
                  "Une demande de mise en contact, pour une entreprise devant être contacté en personne",
                value: contactInPersonExample,
              },
            },
          },
          responses: {
            "201": {
              description: "Opération réussie",
            },
            "400": {
              description:
                "Error dans la contrat, ou le mode de contact ne correspond pas à celui renseigné par l'entreprise",
              example: {
                status: 400,
                message:
                  "Contact mode mismatch: 'EMAIL' in params. In contact (fetched with siret) : 'PHONE'",
              },
            },
            "401": {
              description: "Utilisateur non authentifié",
              example: error401Example,
            },
            "403": {
              description:
                "Accès non autorisé (veuillez vérifier que vous avez les droits)",
              example: error403Example,
            },
            "404": {
              description: "Établissement/Contact non trouvé",
              example: error404Example,
            },
          },
        },
      },
    },
    [conventionSection]: {
      getConventionById: {
        summary: "Récupération d'une convention",
        description: "Renvoie la convention correspondante",
        extraDocs: {
          responses: {
            "200": {
              description: "Retourne la convention",
              example: {
                ...new ConventionDtoBuilder().build(),
                agencyName: "Agence de test",
                agencyDepartment: "75",
              },
            },
            "400": {
              description: "Erreur dans le contrat d'api'",
            },
            "401": {
              description: "Utilisateur non authentifié",
              example: error401Example,
            },
            "403": {
              description:
                "Accès non autorisé (veuillez vérifier que vous avez les droits)",
              example: error403Example,
            },
            "404": {
              description: "Convention non trouvé",
              example: error404Example,
            },
          },
        },
      },
      getConventions: {
        summary:
          "Récupération de conventions filtrées sur le scope du consommateur de l'api",
        description: "Renvoie les conventions correspondantes",
        extraDocs: {
          responses: {
            "200": {
              description: "Retourne un tableau de conventions",
              example: [
                {
                  ...new ConventionDtoBuilder().build(),
                  agencyName: "Agence de test",
                  agencyDepartment: "75",
                },
              ],
            },
            "400": {
              description: "Erreur dans le contrat d'api'",
            },
            "401": {
              description: "Utilisateur non authentifié",
              example: error401Example,
            },
            "403": {
              description:
                "Accès non autorisé (veuillez vérifier que vous avez les droits)",
              example: error403Example,
            },
          },
        },
      },
    },
  });
