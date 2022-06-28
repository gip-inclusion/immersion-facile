import { IncomingMessage } from "http";
import type {
  CreateSmtpEmail,
  SendSmtpEmail,
  TransactionalEmailsApi,
} from "sib-api-v3-typescript";
import { makeEmailAllowListPredicate } from "../../adapters/primary/config/repositoriesConfig";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { ValidatedConventionFinalConfirmationParams } from "../../domain/convention/ports/EmailGateway";

describe("SendingBlueEmailGateway", () => {
  type SendTransacEmailResponse = {
    response: IncomingMessage;
    body: CreateSmtpEmail;
  };

  let mockedApi: TransactionalEmailsApi;
  let allowListPredicate;
  let sibGateway: SendinblueEmailGateway;
  let sentEmails: SendSmtpEmail[];

  beforeEach(() => {
    sentEmails = [];

    mockedApi = {
      // eslint-disable-next-line @typescript-eslint/require-await
      sendTransacEmail: async (receivedEmailData: SendSmtpEmail) => {
        sentEmails.push(receivedEmailData);
        return {} as unknown as SendTransacEmailResponse;
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setApiKey: (): void => {},
    } as unknown as TransactionalEmailsApi;

    allowListPredicate = makeEmailAllowListPredicate({
      emailAllowList: [
        "beneficiary@gmail.com",
        "advisor@gmail.com",
        "establishment-ceo@gmail.com",
        "establishment-cto@gmail.com",
      ],
      skipEmailAllowlist: false,
    });

    sibGateway = SendinblueEmailGateway.create(
      "plop",
      allowListPredicate,
      mockedApi,
    );
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  it("should filter emails according to predicate", async () => {
    await sibGateway.sendValidatedConventionFinalConfirmation(
      [
        "beneficiary@gmail.com",
        "advisor@gmail.com",
        "i-am-not-allowed@mail.net",
      ],
      {
        scheduleText: "",
      } as unknown as ValidatedConventionFinalConfirmationParams,
    );

    expect(sentEmails[0].to).toEqual([
      { email: "beneficiary@gmail.com" },
      { email: "advisor@gmail.com" },
    ]);
  });

  it("should filter email and carbon copy according to predicate", async () => {
    const carbonCopy = [
      "establishment-cto@gmail.com",
      "establishment-comptable-not-allowed@gmail.com",
    ];

    await sibGateway.sendFormEstablishmentEditionSuggestion(
      "establishment-ceo@gmail.com",
      carbonCopy,
      { editFrontUrl: "plop" },
    );

    expect(sentEmails[0]).toEqual({
      cc: [
        {
          email: "establishment-cto@gmail.com",
        },
      ],
      to: [
        {
          email: "establishment-ceo@gmail.com",
        },
      ],
      params: {
        EDIT_FRONT_LINK: "plop",
      },
      templateId: 26,
    });
  });
});
