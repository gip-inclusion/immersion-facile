import type { TallyForm } from "shared";

export const johnDoeEmail = "john.doe@gmail.com";
export const crispMessageContent = "J'ai eu un problème, que voici...";
export const crispDeleteReason =
  "Cela ne correspond pas à notre processus de vérification, d'enregistrement et de signature interne.";
export const conventionFromTally = "11112222-3333-4444-5555-666677778888";
export const crispTicketSiret = "11112222333344";
export const conventionWithAssessment = "22223333-4444-5555-6666-777788889999";
export const assessmentLink =
  "https://immersion-facile.beta.gouv.fr/assessment/22223333-4444-5555-6666-777788889999";

export const tallyFormCase0TicketToSkip: TallyForm = {
  eventId: "6a49da03-cc7a-4544-bdd4-fc8ef70eb295",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-03-03T13:36:54.748Z",
  data: {
    responseId: "5yveaN",
    submissionId: "5yveaN",
    respondentId: "25DPxV",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-03-03T13:36:54.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,prescripteur,close-ticket",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "true",
      },
    ],
  },
};

export const tallyFormCase1: TallyForm = {
  eventId: "74e8fd8e-87b1-43cb-be8c-408ca0171064",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-25T10:58:44.374Z",
  data: {
    responseId: "6albLo",
    submissionId: "6albLo",
    respondentId: "LyPE5G",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-25T10:58:37.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,beneficiaire",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_YjKMyJ",
        label:
          'Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?',
        type: "MULTIPLE_CHOICE",
        value: ["dcaf5b0f-a0ff-4c97-b65a-e64cba709033"],
        options: [
          {
            id: "e6e76858-b930-4e0b-b35d-70a7ccec665e",
            text: "J'ai besoin d'aide concernant une Immersion passée ou en cours",
          },
          {
            id: "1faa0f3d-311c-4fdf-8d0d-405dc2a5cd99",
            text: "J'ai besoin d'accéder à ma convention finale validée",
          },
          {
            id: "22057d55-ea13-4384-82b5-f89ad5843ade",
            text: "Je veux renouveler une convention",
          },
          {
            id: "c4dff998-f25c-4749-919b-3a29246ebcd7",
            text: "Je recherche des informations générales sur les immersions professionnelles",
          },
          {
            id: "56cbcf5e-9237-4ba9-b447-56f30c05f040",
            text: "Je suis une entreprise référencée sur le site Immersion Facile",
          },
          {
            id: "7216a061-c1d7-4024-aa83-c10f60e596a5",
            text: "Je suis prescripteur de PMSMP (Mission locale, France Travail, Conseil départemental, CEP...)",
          },
          {
            id: "dcaf5b0f-a0ff-4c97-b65a-e64cba709033",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_PpRzBx",
        label: "Vous êtes",
        type: "MULTIPLE_CHOICE",
        value: ["b01a2f91-c340-487c-ace3-a9bdce96b6b4"],
        options: [
          {
            id: "b01a2f91-c340-487c-ace3-a9bdce96b6b4",
            text: "Le bénéficiaire",
          },
          {
            id: "f66a955b-1e5b-42a8-9929-93b8671c8570",
            text: "L'entreprise",
          },
          {
            id: "98004797-13cf-4128-af3e-446c384948fb",
            text: "Le prescripteur ou la structure d'accompagnement",
          },
          {
            id: "a9af71a2-0b48-462d-9768-e7736fd44a68",
            text: "Vous ne savez pas",
          },
        ],
      },
      {
        key: "question_Oa4Y87",
        label: "Vous nous écrivez pour...",
        type: "MULTIPLE_CHOICE",
        value: ["e47f860f-ed1e-43af-95b0-5b31879bd892"],
        options: [
          {
            id: "e47f860f-ed1e-43af-95b0-5b31879bd892",
            text: "Vous-même",
          },
          {
            id: "7204db7d-e13e-443c-8c38-671721a2d0ce",
            text: "Quelqu'un d'autre",
          },
        ],
      },
      {
        key: "question_MeYNZk",
        label: "Votre email",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_lbWeGv",
        label: "Merci de préciser votre demande",
        type: "TEXTAREA",
        value: crispMessageContent,
      },
    ],
  },
};

export const makeTallyFormCase2WithConventionId = (
  conventionId: string,
): TallyForm => ({
  eventId: "c23ba90d-e546-4664-b2c2-1196f11e120c",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-25T12:57:44.237Z",
  data: {
    responseId: "QPbOpp",
    submissionId: "QPbOpp",
    respondentId: "957AvG",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-25T12:57:38.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,beneficiaire",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_YjKMyJ",
        label:
          'Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?',
        type: "MULTIPLE_CHOICE",
        value: ["e6e76858-b930-4e0b-b35d-70a7ccec665e"],
        options: [
          {
            id: "e6e76858-b930-4e0b-b35d-70a7ccec665e",
            text: "J'ai besoin d'aide concernant une Immersion passée ou en cours",
          },
          {
            id: "1faa0f3d-311c-4fdf-8d0d-405dc2a5cd99",
            text: "J'ai besoin d'accéder à ma convention finale validée",
          },
          {
            id: "22057d55-ea13-4384-82b5-f89ad5843ade",
            text: "Je veux renouveler une convention",
          },
          {
            id: "c4dff998-f25c-4749-919b-3a29246ebcd7",
            text: "Je recherche des informations générales sur les immersions professionnelles",
          },
          {
            id: "56cbcf5e-9237-4ba9-b447-56f30c05f040",
            text: "Je suis une entreprise référencée sur le site Immersion Facile",
          },
          {
            id: "7216a061-c1d7-4024-aa83-c10f60e596a5",
            text: "Je suis prescripteur de PMSMP (Mission locale, France Travail, Conseil départemental, CEP...)",
          },
          {
            id: "dcaf5b0f-a0ff-4c97-b65a-e64cba709033",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_DqEJyZ",
        label: "Ces articles ont-ils répondu à vos questions ?",
        type: "MULTIPLE_CHOICE",
        value: ["cafe4baa-1b98-4db5-ae05-04a53a34f3fa"],
        options: [
          {
            id: "375384f9-c22b-4342-92ea-fead24e876d2",
            text: "Oui",
          },
          {
            id: "cafe4baa-1b98-4db5-ae05-04a53a34f3fa",
            text: "Non",
          },
        ],
      },
      {
        key: "question_PpRzBx",
        label: "Vous êtes",
        type: "MULTIPLE_CHOICE",
        value: ["b01a2f91-c340-487c-ace3-a9bdce96b6b4"],
        options: [
          {
            id: "b01a2f91-c340-487c-ace3-a9bdce96b6b4",
            text: "Le bénéficiaire",
          },
          {
            id: "f66a955b-1e5b-42a8-9929-93b8671c8570",
            text: "L'entreprise",
          },
          {
            id: "98004797-13cf-4128-af3e-446c384948fb",
            text: "Le prescripteur ou la structure d'accompagnement",
          },
          {
            id: "a9af71a2-0b48-462d-9768-e7736fd44a68",
            text: "Vous ne savez pas",
          },
        ],
      },
      {
        key: "question_Oa4Y87",
        label: "Vous nous écrivez pour...",
        type: "MULTIPLE_CHOICE",
        value: ["e47f860f-ed1e-43af-95b0-5b31879bd892"],
        options: [
          {
            id: "e47f860f-ed1e-43af-95b0-5b31879bd892",
            text: "Vous-même",
          },
          {
            id: "7204db7d-e13e-443c-8c38-671721a2d0ce",
            text: "Quelqu'un d'autre",
          },
        ],
      },
      {
        key: "question_RGYMNj",
        label:
          "ID de convention (pour accélérer le traitement de votre demande)",
        type: "INPUT_TEXT",
        value: conventionId,
      },
      {
        key: "question_MeYNZk",
        label: "Votre email",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_lbWeGv",
        label: "Merci de préciser votre demande",
        type: "TEXTAREA",
        value: crispMessageContent,
      },
    ],
  },
});

export const tallyFormCase3 = {
  eventId: "8063f6b3-ec89-458b-a5f7-bfb5fd293858",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-25T15:32:36.276Z",
  data: {
    responseId: "q0ya4O",
    submissionId: "q0ya4O",
    respondentId: "65NZ1O",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-25T15:32:26.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,prescripteur",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_YjKMyJ",
        label:
          'Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?',
        type: "MULTIPLE_CHOICE",
        value: ["7216a061-c1d7-4024-aa83-c10f60e596a5"],
        options: [
          {
            id: "e6e76858-b930-4e0b-b35d-70a7ccec665e",
            text: "J'ai besoin d'aide concernant une Immersion passée ou en cours",
          },
          {
            id: "1faa0f3d-311c-4fdf-8d0d-405dc2a5cd99",
            text: "J'ai besoin d'accéder à ma convention finale validée",
          },
          {
            id: "22057d55-ea13-4384-82b5-f89ad5843ade",
            text: "Je veux renouveler une convention",
          },
          {
            id: "c4dff998-f25c-4749-919b-3a29246ebcd7",
            text: "Je recherche des informations générales sur les immersions professionnelles",
          },
          {
            id: "56cbcf5e-9237-4ba9-b447-56f30c05f040",
            text: "Je suis une entreprise référencée sur le site Immersion Facile",
          },
          {
            id: "7216a061-c1d7-4024-aa83-c10f60e596a5",
            text: "Je suis prescripteur de PMSMP (Mission locale, France Travail, Conseil départemental, CEP...)",
          },
          {
            id: "dcaf5b0f-a0ff-4c97-b65a-e64cba709033",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_Oa4Y87",
        label: "Vous nous écrivez pour...",
        type: "MULTIPLE_CHOICE",
        value: ["e47f860f-ed1e-43af-95b0-5b31879bd892"],
        options: [
          {
            id: "e47f860f-ed1e-43af-95b0-5b31879bd892",
            text: "Vous-même",
          },
          {
            id: "7204db7d-e13e-443c-8c38-671721a2d0ce",
            text: "Quelqu'un d'autre",
          },
        ],
      },
      {
        key: "question_MeYNZk",
        label: "Votre email",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_lbWeGv",
        label: "Merci de préciser votre demande",
        type: "TEXTAREA",
        value: crispMessageContent,
      },
      {
        key: "question_44v0QA",
        label: "Sur quoi porte votre demande ?",
        type: "DROPDOWN",
        value: ["62d320a4-d36e-406f-95cc-fe0136c15c02"],
        options: [
          {
            id: "82f2fb04-f0c7-4bc1-ae23-b04028706705",
            text: "Je n'ai pas reçu le lien pour valider la demande d'immersion",
          },
          {
            id: "62d320a4-d36e-406f-95cc-fe0136c15c02",
            text: "Je veux référencer ma structure sur le site Immersion Facilitée",
          },
          {
            id: "a753d143-39e7-44ce-a6e9-f5123a2e558a",
            text: "J'accompagne un candidat dont l'immersion commence bientôt",
          },
          {
            id: "e6a7a908-1eb7-45fd-8d52-fd37131b722a",
            text: "J'ai une question sur le bilan",
          },
          {
            id: "0cd28dd4-e144-4b5a-aac8-2ad85435378e",
            text: "J'ai une question sur les outils France Travail",
          },
          {
            id: "350f2273-5460-48ae-ba2f-ff55baa1391f",
            text: "La délégation de prescription accélérée proposée par Immersion Facilitée",
          },
          {
            id: "00c48f67-82ab-46ff-9916-81ec224144ae",
            text: "J'ai une question sur Inclusion Connect", // On a encore "Inclusion Connect dans le form Tally ?"
          },
          {
            id: "d98ea633-00ab-43d2-93b1-7f14f3fe3353",
            text: "Autre chose",
          },
          {
            id: "4a9eefc1-4e88-4ea4-993f-a64404773c1a",
            text: "J'ai besoin de procéder à un renouvellement de convention",
          },
        ],
      },
      {
        key: "question_XxYVPP",
        label: "Cet article a-t-il répondu à votre question ? ",
        type: "MULTIPLE_CHOICE",
        value: ["b9a1ef94-270c-49c3-9aed-23693c9cae18"],
        options: [
          {
            id: "15c6512b-415d-4f2b-b43b-0b077caa9fcf",
            text: "Oui",
          },
          {
            id: "b9a1ef94-270c-49c3-9aed-23693c9cae18",
            text: "Non",
          },
        ],
      },
    ],
  },
};

export const tallyFormCase4Establishment: TallyForm = {
  eventId: "edd15e9d-9653-4e82-9ce9-621e712bf782",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-26T11:21:15.949Z",
  data: {
    responseId: "J5NJWo",
    submissionId: "J5NJWo",
    respondentId: "DyN0EN",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-26T11:21:09.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,entreprise,suppression-entreprise,suppression-entreprise",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_YjKMyJ",
        label:
          'Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?',
        type: "MULTIPLE_CHOICE",
        value: ["56cbcf5e-9237-4ba9-b447-56f30c05f040"],
        options: [
          {
            id: "e6e76858-b930-4e0b-b35d-70a7ccec665e",
            text: "J'ai besoin d'aide concernant une Immersion passée ou en cours",
          },
          {
            id: "1faa0f3d-311c-4fdf-8d0d-405dc2a5cd99",
            text: "J'ai besoin d'accéder à ma convention finale validée",
          },
          {
            id: "22057d55-ea13-4384-82b5-f89ad5843ade",
            text: "Je veux renouveler une convention",
          },
          {
            id: "c4dff998-f25c-4749-919b-3a29246ebcd7",
            text: "Je recherche des informations générales sur les immersions professionnelles",
          },
          {
            id: "56cbcf5e-9237-4ba9-b447-56f30c05f040",
            text: "Je suis une entreprise référencée sur le site Immersion Facile",
          },
          {
            id: "7216a061-c1d7-4024-aa83-c10f60e596a5",
            text: "Je suis prescripteur de PMSMP (Mission locale, France Travail, Conseil départemental, CEP...)",
          },
          {
            id: "dcaf5b0f-a0ff-4c97-b65a-e64cba709033",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_818VNA",
        label: "Sur quoi porte votre demande ?",
        type: "DROPDOWN",
        value: ["69ba19ab-c166-4cec-8a98-68ad34b4a0a4"],
        options: [
          {
            id: "69ba19ab-c166-4cec-8a98-68ad34b4a0a4",
            text: "Je souhaite supprimer mon entreprise de la liste des Entreprises Accueillantes sur Immersion Facile",
          },
          {
            id: "c82032d2-940d-4c84-8f46-48dfecbf6cb5",
            text: "Je souhaite modifier ma fiche entreprise",
          },
          {
            id: "b88240a1-a447-4138-8fb4-546e79c2803f",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_eq2Jxo",
        label:
          "Pour quelle raison principale souhaitez-vous arrêter d'accueillir d'immersions professionnelles",
        type: "MULTIPLE_CHOICE",
        value: ["1f67862e-ed6e-48b4-ad93-accbb48c22b9"],
        options: [
          {
            id: "261cba9c-c626-4602-a148-be86c0a221ff",
            text: "Je n'ai pas de besoin d'embauche en ce moment",
          },
          {
            id: "ab0cb728-55a4-43b2-a9f8-3f183b0714fc",
            text: "Je n'ai pas le temps d'accompagner un candidat",
          },
          {
            id: "36c46dd5-b351-437f-9060-1c6b98ad1e71",
            text: "Je reçois trop de demandes",
          },
          {
            id: "8d0cfa84-7f28-45de-be1b-678e1b28e5a4",
            text: "Je ne me souviens pas m'être inscrit.e sur le service",
          },
          {
            id: "a32cfdcc-bc9c-4120-9e9d-cd2a4f5fa289",
            text: "Mon établissement a fermé",
          },
          {
            id: "1f67862e-ed6e-48b4-ad93-accbb48c22b9",
            text: "Autre",
          },
        ],
      },
      {
        key: "question_A7DYbl",
        label: "Merci de préciser votre raison",
        type: "TEXTAREA",
        value: crispDeleteReason,
      },
      {
        key: "question_yPEXQB",
        label: "Votre numéro de Siret (sans espaces)",
        type: "INPUT_TEXT",
        value: crispTicketSiret,
      },
      {
        key: "question_dWjMkV",
        label: "Nom de l'entreprise",
        type: "INPUT_TEXT",
        value: "Université Rennes 2",
      },
      {
        key: "question_gDZxKl",
        label: "Votre email (pour nous permettre de valider cette demande) ?",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
    ],
  },
};

export const tallyFormCase5: TallyForm = {
  eventId: "140aef79-7372-4d2d-a738-d9b8f53ac1c9",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-26T13:23:34.959Z",
  data: {
    responseId: "6aXEgP",
    submissionId: "6aXEgP",
    respondentId: "GyzajZ",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-26T13:23:25.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,modification,beneficiaire,pour-prescripteur",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["1f86699b-2430-4b46-a97b-6d67768c9b25"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_VLYXBE",
        label: "Ces articles ont-ils répondu à vos questions ?",
        type: "MULTIPLE_CHOICE",
        value: ["249bb71d-cf37-449b-84ca-eee781cccb40"],
        options: [
          {
            id: "03f9d916-0419-4baa-9e0f-c1191d588e99",
            text: "Oui",
          },
          {
            id: "249bb71d-cf37-449b-84ca-eee781cccb40",
            text: "Non",
          },
        ],
      },
      {
        key: "question_Oa4Y87",
        label: "Vous nous écrivez pour...",
        type: "MULTIPLE_CHOICE",
        value: ["7204db7d-e13e-443c-8c38-671721a2d0ce"],
        options: [
          {
            id: "e47f860f-ed1e-43af-95b0-5b31879bd892",
            text: "Vous-même",
          },
          {
            id: "7204db7d-e13e-443c-8c38-671721a2d0ce",
            text: "Quelqu'un d'autre",
          },
        ],
      },
      {
        key: "question_RGYMNj",
        label:
          "ID de convention (pour accélérer le traitement de votre demande)",
        type: "INPUT_TEXT",
        value: "76f8f40b-1b43-4623-8592-47209b1e7dfb",
      },
      {
        key: "question_MeYNZk",
        label: "Votre email",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_lbWeGv",
        label: "Merci de préciser votre demande",
        type: "TEXTAREA",
        value: crispMessageContent,
      },
      {
        key: "question_vGEzzv",
        label: "Vous êtes : ",
        type: "MULTIPLE_CHOICE",
        value: ["562d2dce-9df3-4525-8b6a-674254c7f778"],
        options: [
          {
            id: "2a3ce164-813c-44d0-a53e-96b94716266f",
            text: "Le bénéficiaire",
          },
          {
            id: "972e8d62-7298-4ab3-9863-a4b9076a7302",
            text: "Le prescripteur ou la structure d'accompagnement",
          },
          {
            id: "562d2dce-9df3-4525-8b6a-674254c7f778",
            text: "L'entreprise",
          },
          {
            id: "ffe75042-9bf4-4057-9193-646c1ceae7d0",
            text: "Vous ne savez pas",
          },
        ],
      },
      {
        key: "question_KYvGGA",
        label: "Merci de choisir le cas qui s'applique à votre situation",
        type: "MULTIPLE_CHOICE",
        value: ["169f65df-75ce-4a97-93af-5594b17181fc"],
        options: [
          {
            id: "570a053c-c3ed-4936-8b71-ab7b7e62478b",
            text: "J'ai l'ID de la convention concernée",
          },
          {
            id: "169f65df-75ce-4a97-93af-5594b17181fc",
            text: "Je n'ai pas l'ID de convention concernée",
          },
        ],
      },
    ],
  },
};

export const tallyFormCase6: TallyForm = {
  eventId: "a12d8bcb-a37f-48f2-8d45-493f53cf8093",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-26T13:48:18.922Z",
  data: {
    responseId: "G8OrL2",
    submissionId: "G8OrL2",
    respondentId: "YyRg1z",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-26T13:48:10.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,entreprise,suppression-entreprise,suppression-entreprise",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_YjKMyJ",
        label:
          'Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?',
        type: "MULTIPLE_CHOICE",
        value: ["56cbcf5e-9237-4ba9-b447-56f30c05f040"],
        options: [
          {
            id: "e6e76858-b930-4e0b-b35d-70a7ccec665e",
            text: "J'ai besoin d'aide concernant une Immersion passée ou en cours",
          },
          {
            id: "1faa0f3d-311c-4fdf-8d0d-405dc2a5cd99",
            text: "J'ai besoin d'accéder à ma convention finale validée",
          },
          {
            id: "22057d55-ea13-4384-82b5-f89ad5843ade",
            text: "Je veux renouveler une convention",
          },
          {
            id: "c4dff998-f25c-4749-919b-3a29246ebcd7",
            text: "Je recherche des informations générales sur les immersions professionnelles",
          },
          {
            id: "56cbcf5e-9237-4ba9-b447-56f30c05f040",
            text: "Je suis une entreprise référencée sur le site Immersion Facile",
          },
          {
            id: "7216a061-c1d7-4024-aa83-c10f60e596a5",
            text: "Je suis prescripteur de PMSMP (Mission locale, France Travail, Conseil départemental, CEP...)",
          },
          {
            id: "dcaf5b0f-a0ff-4c97-b65a-e64cba709033",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_DqEJyZ",
        label: "Ces articles ont-ils répondu à vos questions ?",
        type: "MULTIPLE_CHOICE",
        value: ["cafe4baa-1b98-4db5-ae05-04a53a34f3fa"],
        options: [
          {
            id: "375384f9-c22b-4342-92ea-fead24e876d2",
            text: "Oui",
          },
          {
            id: "cafe4baa-1b98-4db5-ae05-04a53a34f3fa",
            text: "Non",
          },
        ],
      },
      {
        key: "question_PpRzBx",
        label: "Vous êtes",
        type: "MULTIPLE_CHOICE",
        value: ["98004797-13cf-4128-af3e-446c384948fb"],
        options: [
          {
            id: "b01a2f91-c340-487c-ace3-a9bdce96b6b4",
            text: "Le bénéficiaire",
          },
          {
            id: "f66a955b-1e5b-42a8-9929-93b8671c8570",
            text: "L'entreprise",
          },
          {
            id: "98004797-13cf-4128-af3e-446c384948fb",
            text: "Le prescripteur ou la structure d'accompagnement",
          },
          {
            id: "a9af71a2-0b48-462d-9768-e7736fd44a68",
            text: "Vous ne savez pas",
          },
        ],
      },
      {
        key: "question_Oa4Y87",
        label: "Vous nous écrivez pour...",
        type: "MULTIPLE_CHOICE",
        value: ["7204db7d-e13e-443c-8c38-671721a2d0ce"],
        options: [
          {
            id: "e47f860f-ed1e-43af-95b0-5b31879bd892",
            text: "Vous-même",
          },
          {
            id: "7204db7d-e13e-443c-8c38-671721a2d0ce",
            text: "Quelqu'un d'autre",
          },
        ],
      },
      {
        key: "question_MeYNZk",
        label: "Votre email",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_818VNA",
        label: "Sur quoi porte votre demande ?",
        type: "DROPDOWN",
        value: ["69ba19ab-c166-4cec-8a98-68ad34b4a0a4"],
        options: [
          {
            id: "69ba19ab-c166-4cec-8a98-68ad34b4a0a4",
            text: "Je souhaite supprimer mon entreprise de la liste des Entreprises Accueillantes sur Immersion Facile",
          },
          {
            id: "c82032d2-940d-4c84-8f46-48dfecbf6cb5",
            text: "Je souhaite modifier ma fiche entreprise",
          },
          {
            id: "b88240a1-a447-4138-8fb4-546e79c2803f",
            text: "Autre chose",
          },
        ],
      },
      {
        key: "question_eq2Jxo",
        label:
          "Pour quelle raison principale souhaitez-vous arrêter d'accueillir d'immersions professionnelles",
        type: "MULTIPLE_CHOICE",
        value: ["36c46dd5-b351-437f-9060-1c6b98ad1e71"],
        options: [
          {
            id: "261cba9c-c626-4602-a148-be86c0a221ff",
            text: "Je n'ai pas de besoin d'embauche en ce moment",
          },
          {
            id: "ab0cb728-55a4-43b2-a9f8-3f183b0714fc",
            text: "Je n'ai pas le temps d'accompagner un candidat",
          },
          {
            id: "36c46dd5-b351-437f-9060-1c6b98ad1e71",
            text: "Je reçois trop de demandes",
          },
          {
            id: "8d0cfa84-7f28-45de-be1b-678e1b28e5a4",
            text: "Je ne me souviens pas m'être inscrit.e sur le service",
          },
          {
            id: "a32cfdcc-bc9c-4120-9e9d-cd2a4f5fa289",
            text: "Mon établissement a fermé",
          },
          {
            id: "1f67862e-ed6e-48b4-ad93-accbb48c22b9",
            text: "Autre",
          },
        ],
      },
      {
        key: "question_BzDYb1",
        label: "Cet article a-t-il répondu à vos questions ?",
        type: "MULTIPLE_CHOICE",
        value: ["2a3b8129-9830-4125-8473-c8c3937d270e"],
        options: [
          {
            id: "e5751b87-23da-4160-a6d1-32ac37572aaf",
            text: "Oui",
          },
          {
            id: "2a3b8129-9830-4125-8473-c8c3937d270e",
            text: "Non",
          },
        ],
      },
      {
        key: "question_yPEXQB",
        label: "Votre numéro de Siret (sans espaces)",
        type: "INPUT_TEXT",
        value: crispTicketSiret,
      },
      {
        key: "question_dWjMkV",
        label: "Nom de l'entreprise",
        type: "INPUT_TEXT",
        value: "COSECUR",
      },
      {
        key: "question_gDZxKl",
        label: "Votre email (pour nous permettre de valider cette demande) ?",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_0QJ7B0_2f038cf8-46d2-4cfe-b2aa-f68837d0ab3f",
        label: "email",
        type: "CALCULATED_FIELDS",
        value: johnDoeEmail,
      },
    ],
  },
};

export const makeTallyFormCase7WithAssessment = (): TallyForm => ({
  eventId: "d23ba90d-e546-4664-b2c2-1196f11e120d",
  eventType: "FORM_RESPONSE",
  createdAt: "2025-02-25T12:57:44.237Z",
  data: {
    responseId: "QPbOpp",
    submissionId: "QPbOpp",
    respondentId: "957AvG",
    formId: "mBdQQe",
    formName: "[Support] Faire une demande de contact (réponse en 48h ouvrées)",
    createdAt: "2025-02-25T12:57:38.000Z",
    fields: [
      {
        key: "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86",
        label: "segment",
        type: "CALCULATED_FIELDS",
        value: "email,beneficiaire",
      },
      {
        key: "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59",
        label: "close_ticket",
        type: "CALCULATED_FIELDS",
        value: "",
      },
      {
        key: "question_PdYMgd",
        label: "Choisissez le cas qui vous correspond le mieux",
        type: "MULTIPLE_CHOICE",
        value: ["4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4"],
        options: [
          {
            id: "104ae2c0-93d2-4399-a312-ab886254ca87",
            text: "Vous souhaitez signer une convention ou envoyer un lien de signature",
          },
          {
            id: "9b390f0c-0346-426d-a131-664e253f15e3",
            text: "Vous recherchez une entreprise accueillante pour une immersion",
          },
          {
            id: "4680bf5f-b7ab-4d4b-bdc0-84861c78d9c4",
            text: "Autre chose",
          },
          {
            id: "1f86699b-2430-4b46-a97b-6d67768c9b25",
            text: "Vous souhaitez modifier une convention",
          },
        ],
      },
      {
        key: "question_PpRzBx",
        label: "Vous êtes",
        type: "MULTIPLE_CHOICE",
        value: ["b01a2f91-c340-487c-ace3-a9bdce96b6b4"],
        options: [
          {
            id: "b01a2f91-c340-487c-ace3-a9bdce96b6b4",
            text: "Le bénéficiaire",
          },
          {
            id: "f66a955b-1e5b-42a8-9929-93b8671c8570",
            text: "L'entreprise",
          },
          {
            id: "98004797-13cf-4128-af3e-446c384948fb",
            text: "Le prescripteur ou la structure d'accompagnement",
          },
          {
            id: "a9af71a2-0b48-462d-9768-e7736fd44a68",
            text: "Vous ne savez pas",
          },
        ],
      },
      {
        key: "question_Oa4Y87",
        label: "Vous nous écrivez pour...",
        type: "MULTIPLE_CHOICE",
        value: ["e47f860f-ed1e-43af-95b0-5b31879bd892"],
        options: [
          {
            id: "e47f860f-ed1e-43af-95b0-5b31879bd892",
            text: "Vous-même",
          },
          {
            id: "7204db7d-e13e-443c-8c38-671721a2d0ce",
            text: "Quelqu'un d'autre",
          },
        ],
      },
      {
        key: "question_RGYMNj",
        label:
          "ID de convention (pour accélérer le traitement de votre demande)",
        type: "INPUT_TEXT",
        value: conventionWithAssessment,
      },
      {
        key: "question_MeYNZk",
        label: "Votre email",
        type: "INPUT_EMAIL",
        value: johnDoeEmail,
      },
      {
        key: "question_lbWeGv",
        label: "Merci de préciser votre demande",
        type: "TEXTAREA",
        value: crispMessageContent,
      },
    ],
  },
});
