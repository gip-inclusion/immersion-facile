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

  it.skip("creates a ticket on crisp", async () => {
    const subject = "Yo";
    const nickname = "Nickname";
    const email = "yo@yo.com";
    const segments = ["segment1"];

    await sendSupportTicketToCrisp.execute(tallyForm);

    expectCrispInitiatedConversationParams([
      {
        helperNote: "Yo",
        message: "Lala",
        metadata: { subject, nickname, email, segments },
      },
    ]);
  });

  const expectCrispInitiatedConversationParams = (
    params: InitiateCrispConversationParams[],
  ) => {
    expect(crispApi.initiatedConversationParams).toEqual(params);
  };
});

// TODO create sample data realistic from prod data
const tallyForm: TallyForm = {
  eventId: "444e93a8-68db-4cc2-ac17-0bbcbd4460f8",
  eventType: "FORM_SUBMISSION",
  createdAt: "2024-04-17T08:56:10.922Z",
  data: {
    responseId: "2O0vAe",
    submissionId: "2O0vAe",
    respondentId: "v2eE1D",
    formId: "w7WM49",
    formName:
      "Recevoir le contact du prescripteur de droit qui peut me délivrer une convention de délégation",
    createdAt: "2024-04-17T08:56:10.000Z",
    fields: [],
  },
};
