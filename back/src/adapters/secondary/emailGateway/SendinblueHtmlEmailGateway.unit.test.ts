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
      params: {
        agencyName: "AGENCY_NAME",
        agencyLogoUrl: "https://beta.gouv.fr/img/logo_twitter_image-2019.jpg",
      },
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
      subject: "Immersion Facilitée : Votre structure a été activée",
      htmlContent: ignoreTabs(`
      <html lang="fr">
      <body>
      <table width="600" align="center" style="margin-top: 20px">

      <tr>
      <td>

      <table width="600">
      <tr>
      <td width="35%">
      <a href="https://immersion-facile.beta.gouv.fr/">
      <img src="https://immersion.cellar-c2.services.clever-cloud.com/ac685d94-401a-4f93-b288-1100a8d96297.png" width="223" height="108" alt="Immersion Facilitée - République Française"/>
      </a>
      </td>
      <td width="60%" align="right">
      <img src="https://beta.gouv.fr/img/logo_twitter_image-2019.jpg" alt="" style="max-width: 150px; max-height: 120px; height: auto; margin-left: 20px;"/>
      </td>

      </tr>
      <tr>
      <td width="600" height="10" colspan="2"></td>
      </tr>
      <tr>
      <td width="600" height="1" style="background-color:#DDDDDD" colspan="2"></td>
      </tr>
      <tr>
      <td width="600" height="30" colspan="2"></td>
      </tr>
      </table>
      </td>
      </tr>

      <tr>
      <td>
      <p>Bonjour,</p>
      </td>
      </tr>

      <tr>
      <td>

      <table width="600">
      <tr>
      <td>
      <p><strong>Votre structure prescriptrice d'immersion est activée !</strong> <br/><br/>Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: AGENCY_NAME. <br/><br/>Merci à vous !</p>
      </td>
      </tr>
      </table>

      </td>
      </tr>

      <tr>
      <td>

      <table width="600">
      <tr>
      <td>
      <p>Bonne journée,<br/>L'équipe Immersion Facilitée</p>
      </td>
      </tr>
      </table>

      </td>
      </tr>

      <tr>
      <td>
      <table>
      <tr>
      <td height="30"></td>
      </tr>
      <tr>

      <td width="600" style="background-color: #F5F5FE; text-align: center; padding: 20px 50px; ">
      <p style="margin-bottom: .5rem; font-weight: bold; font-size: 18px;">L'immersion facilitée - Une startup d’Etat du Groupement d’Intérêt Public - La plateforme de l’inclusion
      </p>
      <p style="font-size: 18px; margin-top: 0;">20 avenue de Ségur, 75007, Paris</p>
      <p style="font-size: 14px;">Cet email a été envoyé à test@test.com<br>
      Vous l'avez reçu car vous avez indiqué cette adresse email  dans votre demande d'immersion.</p>

      </td>
      </tr>
      <tr>
      <td align="center" style="padding: 20px;">
      <img src="https://immersion.cellar-c2.services.clever-cloud.com/d0cfdb84-881a-40d5-b228-7e14c185fb68.png" alt="" width="290" />
      </td>
      </tr>
      </table>
      </td>
      </tr>
      
      </table>
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
