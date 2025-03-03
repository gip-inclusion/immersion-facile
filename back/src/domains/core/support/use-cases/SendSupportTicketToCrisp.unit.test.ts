import { ConventionDtoBuilder } from "shared";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryCrispApi } from "../adapters/InMemoryCrispApi";
import { InitiateCrispConversationParams } from "../ports/CrispGateway";
import {
  SendSupportTicketToCrisp,
  makeSendSupportTicketToCrisp,
} from "./SendSupportTicketToCrisp";
import {
  conventionFromTally,
  crispDeleteReason,
  crispMessageContent,
  crispTicketSiret,
  johnDoeEmail,
  tallyFormCase0TicketToSkip,
  tallyFormCase1,
  tallyFormCase2WithConventionId,
  tallyFormCase3,
  tallyFormCase4Establishment,
  tallyFormCase5,
  tallyFormCase6,
} from "./SendSupportTicketToCrisp.testData";

describe("SendSupportTicketToCrisp", () => {
  const convention = new ConventionDtoBuilder()
    .withId(conventionFromTally)
    .build();
  let sendSupportTicketToCrisp: SendSupportTicketToCrisp;
  let uow: InMemoryUnitOfWork;
  let crispApi: InMemoryCrispApi;

  beforeEach(() => {
    uow = createInMemoryUow();
    crispApi = new InMemoryCrispApi();
    uow.conventionRepository.setConventions([convention]);
    sendSupportTicketToCrisp = makeSendSupportTicketToCrisp({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        crispApi,
      },
    });
  });

  describe("It creates a ticket on crisp from different usecases", () => {
    it.each([
      {
        name: "case 0",
        tallyForm: tallyFormCase0TicketToSkip,
        expectNotCalled: true,
      },
      {
        name: "case 1",
        tallyForm: tallyFormCase1,
        expectedParams: {
          message: crispMessageContent,
          helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Retrouver la convention par Email de bénéficiaire:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?email_b%25C3%25A9n%25C3%25A9ficiaire=${johnDoeEmail}

-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "beneficiaire"],
          },
        },
      },
      {
        name: "case 2, with convention ID",
        tallyForm: tallyFormCase2WithConventionId,
        expectedParams: {
          message: crispMessageContent,
          helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Convention ID: ${conventionFromTally}
Type de convention: immersion

Pilotage admin:
https://immersion-facile.beta.gouv.fr/admin/conventions/${conventionFromTally}

Liste de conventions:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?id_de_convention=${conventionFromTally}

Liens magiques de cette convention:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_numero_de_convention=${conventionFromTally}

-----------
Retrouver la convention par Email de bénéficiaire:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?email_b%25C3%25A9n%25C3%25A9ficiaire=${johnDoeEmail}

-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "beneficiaire", "immersion"],
          },
        },
      },
      {
        name: "case 3, whatever",
        tallyForm: tallyFormCase3,
        expectedParams: {
          message: crispMessageContent,
          helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "prescripteur"],
          },
        },
      },
      {
        name: "case 4, with siret",
        tallyForm: tallyFormCase4Establishment,
        expectedParams: {
          message: `Demande de suppression d'entreprise pour la raison suivante: ${crispDeleteReason}`,
          helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Siret fourni : ${crispTicketSiret}
Piloter l'entreprise (dont suppression): https://immersion-facile.beta.gouv.fr/pilotage-etablissement-admin?siret=${crispTicketSiret}

-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "entreprise", "suppression-entreprise"],
          },
        },
      },
      {
        name: "case 5",
        tallyForm: tallyFormCase5,
        expectedParams: {
          message: crispMessageContent,
          helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Convention ID: 76f8f40b-1b43-4623-8592-47209b1e7dfb - Non trouvée dans la base de données

-----------
Retrouver la convention par Email de l'entreprise:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?email_repr%25C3%25A9sentant_de_l%27entreprise=john.doe@gmail.com

-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
          metadata: {
            email: johnDoeEmail,
            segments: [
              "email",
              "modification",
              "beneficiaire",
              "pour-prescripteur",
            ],
          },
        },
      },
      {
        name: "case 6, suppression entreprise",
        tallyForm: tallyFormCase6,
        expectedParams: {
          message: "Demande de suppression d'entreprise",
          helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Siret fourni : ${crispTicketSiret}
Piloter l'entreprise (dont suppression): https://immersion-facile.beta.gouv.fr/pilotage-etablissement-admin?siret=${crispTicketSiret}

Pour quelle raison principale souhaitez-vous arrêter d'accueillir d'immersions professionnelles:
Je reçois trop de demandes

-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "entreprise", "suppression-entreprise"],
          },
        },
      },
    ])(
      "Ticket on crisp: $name",
      async ({ tallyForm, expectedParams, expectNotCalled }) => {
        await sendSupportTicketToCrisp.execute(tallyForm);
        expectNotCalled
          ? expectCrispInitiatedConversationParams([])
          : expectCrispInitiatedConversationParams([expectedParams]);
      },
    );
  });

  const expectCrispInitiatedConversationParams = (
    params: (InitiateCrispConversationParams | undefined)[],
  ) => {
    if (params.some((p) => p === undefined))
      throw new Error("some param was : undefined");
    expect(crispApi.initiatedConversationParams).toEqual(params);
  };
});
