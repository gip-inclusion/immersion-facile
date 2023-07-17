import { SearchImmersionResultDto } from "shared";
import { createOpenApiGenerator } from "shared-routes/openapi";
import { AppConfig } from "../../config/appConfig";
import { ContactEstablishmentPublicV2Dto } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import { publicApiV2Routes } from "./publicApiV2.routes";

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

const searchImmersionResult: SearchImmersionResultDto = {
  additionalInformation: "Some additionnal information",
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
  name: "Raison social de ma super boite",
  numberOfEmployeeRange: "",
  position: {
    lat: 48.8589507,
    lon: 2.3468078,
  },
  siret: "11110000222200",
  voluntaryToImmersion: true,
  website: "www.masuperboite.com",
};

const apiKeyAuth = "apiKeyAuth";

const searchSection = "Recherche d'entreprise accueillante et mise en contact";

const getServers = () => {
  const config = AppConfig.createFromEnv();
  if (config.envType === "production") {
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
      description: config.envType,
    },
  ];
};

const generateOpenApi = createOpenApiGenerator(
  { [searchSection]: publicApiV2Routes },
  {
    info: {
      title: "Les API Immersion facilitée",
      description: `Ceci est la documentation pour consommer l’api d’immersion facilité.
      Une clé API est nécessaire pour utiliser l’api. Veuillez vous mettre en contact avec l’équipe d’immersion facilité pour l’obtenir.
      La clé API est à fournir en authorization header de toutes les requêtes.
      
      ⚠️Attention, cette documentation est encore en cours de construction.
      L'API n'est pas encore disponible à la consommation. ⚠️
      `,
      version: "v2",
    },
    servers: getServers(),
    openapi: "3.1.0",
    security: [{ [apiKeyAuth]: [] }],
    components: {
      securitySchemes: {
        [apiKeyAuth]: {
          type: "apiKey",
          in: "header",
          name: "authorization",
          description:
            "Une clé api est nécessaire pour utiliser l’api. Veuillez contacter immersion facilité si vous souhaitez l’obtenir.",
        },
      },
    },
  },
);

export const openApiSpecV2 = generateOpenApi({
  [searchSection]: {
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
            example: [searchImmersionResult],
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
      summary: "Récupération d’un résultat de recherche d'immersion connu",
      description: "Description : Renvoie l'offre d'immersion correspondante",
      extraDocs: {
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
        headerParams: {
          authorization: {
            description:
              "La clé API à fournir. (Pas besoin de 'Bearer xxx', juste 'xxx')",
            example: "my-jwt-token",
          },
        },
        responses: {
          "200": {
            description: "Opération réussie",
            example: searchImmersionResult,
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
      description: `⚠️Vous devez fournir le mode de contact qui a été renseigné par l’entreprise (dans les résultats de recherche) ⚠️. Ce qui se passe:
      
      EMAIL : L’entreprise va recevoir le message du candidat par email et c’est la responsabilité de l’entreprise de recontacter le candidat (le mail du candidat est fourni à l’entreprise).
      
      PHONE : Dans le cas téléphone le candidat va recevoir un email avec le téléphone de la personne à contacter dans l’entreprise.
      
      IN_PERSON : Dans le cas en personne le candidat reçoit un email avec le nom de la personne, et l’adresse de l’entreprise et doit se présenter en personne.`,

      extraDocs: {
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
