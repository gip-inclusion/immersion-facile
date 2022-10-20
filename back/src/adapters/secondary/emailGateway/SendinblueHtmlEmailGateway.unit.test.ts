import type { AxiosInstance } from "axios";
import { ignoreTabs } from "html-templates";
import { expectPromiseToFailWithError, expectToEqual } from "shared";

import { makeEmailAllowListPredicate } from "../../primary/config/appConfig";
import { BadRequestError } from "../../primary/helpers/httpErrors";

import {
  HtmlEmailData,
  SendinblueHtmlEmailGateway,
} from "./SendinblueHtmlEmailGateway";

const sender = { name: "bob", email: "Machin@mail.com" };

describe("SendingBlueHtmlEmailGateway unit", () => {
  let fakeAxiosInstance: AxiosInstance;
  let allowListPredicate;
  let sibGateway: SendinblueHtmlEmailGateway;
  let sentEmails: HtmlEmailData[];

  beforeEach(() => {
    sentEmails = [];

    fakeAxiosInstance = {
      post(
        _url: string,
        emailData: HtmlEmailData,
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

    sibGateway = new SendinblueHtmlEmailGateway(
      fakeAxiosInstance,
      allowListPredicate,
      "fake-api-key",
      sender,
      { skipHead: true },
    );
  });

  it("should throw if no recipient is provided", async () => {
    const triggerSendEmail = () =>
      sibGateway.sendEmail({
        type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
        recipients: [],
        params: {
          scheduleText: "",
        } as any,
      });

    await expectPromiseToFailWithError(
      triggerSendEmail(),
      new BadRequestError("No recipient for provided email"),
    );
  });

  it("should not send email if recipient are not in white list", async () => {
    await sibGateway.sendEmail({
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients: ["i-am-not-allowed@mail.net"],
      params: {
        scheduleText: "",
      } as any,
    });

    expect(sentEmails).toHaveLength(0);
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
      type: "AGENCY_WAS_ACTIVATED",
      recipients: ["establishment-ceo@gmail.com"],
      cc: carbonCopy,
      params: { agencyName: "My agency", agencyLogoUrl: "www.mylogo.com" },
    });

    expectToEqual(sentEmails[0], {
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
      subject: "Votre agence a été activée",
      htmlContent: ignoreTabs(`
        <html lang="fr">
          <body>
            <p>Mon header www.mylogo.com</p>
            <table>
              <tr>
                <td><strong>Votre structure prescriptrice d'immersion est activée !</strong> <br/><br/>Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: My agency. <br/><br/>Merci à vous !</td>
              </tr>
            </table>
            <p>Mon footer</p>
          </body>
        </html>
      `),
      sender,
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
