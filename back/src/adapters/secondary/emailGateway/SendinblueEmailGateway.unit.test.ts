import type { AxiosInstance } from "axios";
import { makeEmailAllowListPredicate } from "../../primary/config/appConfig";

import { EmailData, SendinblueEmailGateway } from "./SendinblueEmailGateway";

describe("SendingBlueEmailGateway unit", () => {
  let fakeAxiosInstance: AxiosInstance;
  let allowListPredicate;
  let sibGateway: SendinblueEmailGateway;
  let sentEmails: EmailData[];

  beforeEach(() => {
    sentEmails = [];

    fakeAxiosInstance = {
      post(
        _url: string,
        emailData: EmailData,
        _config?: { headers: Record<string, string> },
      ) {
        sentEmails.push(emailData);
      },
    } as unknown as AxiosInstance;

    allowListPredicate = makeEmailAllowListPredicate({
      emailAllowList: [
        "beneficiary@gmail.com",
        "advisor@gmail.com",
        "establishment-ceo@gmail.com",
        "establishment-cto@gmail.com",
      ],
      skipEmailAllowList: false,
    });

    sibGateway = new SendinblueEmailGateway(
      fakeAxiosInstance,
      allowListPredicate,
      "fake-api-key",
    );
  });

  it("should filter emails according to predicate", async () => {
    await sibGateway.sendEmail({
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients: [
        "beneficiary@gmail.com",
        "advisor@gmail.com",
        "i-am-not-allowed@mail.net",
      ],
      params: {
        scheduleText: "",
      } as any,
    });

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

    await sibGateway.sendEmail({
      type: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
      recipients: ["establishment-ceo@gmail.com"],
      cc: carbonCopy,
      params: { editFrontUrl: "plop" },
    });

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

  it("should NOT be able to retrieve last emails sent", async () => {
    await sibGateway.sendEmail({
      type: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
      recipients: ["establishment-ceo@gmail.com"],
      cc: [],
      params: { editFrontUrl: "plop" },
    });

    await expect(() => sibGateway.getLastSentEmailDtos()).toThrow(
      new Error(
        "It is not possible de get last sent mails from SendInBlue email gateway",
      ),
    );
  });
});
