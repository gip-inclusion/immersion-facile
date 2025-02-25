import { TallyForm } from "shared";
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
  johnDoeEmail,
  tallyFormCase1,
  tallyFormCase2WithConventionId,
  tallyFormCase3,
} from "./SendSupportTicketToCrisp.testData";

describe("SendSupportTicketToCrisp", () => {
  let sendSupportTicketToCrisp: SendSupportTicketToCrisp;
  let uow: InMemoryUnitOfWork;
  let crispApi: InMemoryCrispApi;

  beforeEach(() => {
    uow = createInMemoryUow();
    crispApi = new InMemoryCrispApi();
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
        name: "case 1",
        tallyForm: tallyFormCase1,
        expectedParams: {
          message: "J'ai eu un problème, que voici...",
          helperNote: `Choisissez le cas qui vous correspond le mieux:
Autre chose

Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?:
Autre chose

Vous êtes:
Le bénéficiaire

Vous nous écrivez pour...:
Vous-même
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
          message: "J'ai eu un problème, que voici...",
          helperNote: `Choisissez le cas qui vous correspond le mieux:
Autre chose

Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?:
J'ai besoin d'aide concernant une Immersion passée ou en cours

Vous êtes:
Le bénéficiaire

Vous nous écrivez pour...:
Vous-même

Convention ID: ${conventionFromTally}`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "beneficiaire"],
          },
        },
      },
      {
        name: "case 3, whatever",
        tallyForm: tallyFormCase3,
        expectedParams: {
          message: "J'ai eu un problème, que voici...",
          helperNote: `Choisissez le cas qui vous correspond le mieux:
Autre chose

Vous avez sélectionné "Autre chose", pouvez-vous préciser la situation qui vous correspond le mieux ?:
Je suis prescripteur de PMSMP (Mission locale, France Travail, Conseil départemental, CEP...)

Vous nous écrivez pour...:
Vous-même

Sur quoi porte votre demande ?:
Je veux référencer ma structure sur le site Immersion Facilitée
`,
          metadata: {
            email: johnDoeEmail,
            segments: ["email", "prescripteur"],
          },
        },
      },
    ])("Ticket on crisp: $name", async ({ tallyForm, expectedParams }) => {
      await sendSupportTicketToCrisp.execute(tallyForm);
      expectCrispInitiatedConversationParams([expectedParams]);
    });
  });

  const expectCrispInitiatedConversationParams = (
    params: InitiateCrispConversationParams[],
  ) => {
    expect(crispApi.initiatedConversationParams).toEqual(params);
  };
});
