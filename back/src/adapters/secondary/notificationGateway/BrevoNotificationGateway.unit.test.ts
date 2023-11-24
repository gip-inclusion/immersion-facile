import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { HttpClient } from "shared-routes";
import { ignoreTabs } from "html-templates";
import { makeEmailAllowListPredicate } from "../../primary/config/appConfig";
import { BadRequestError } from "../../primary/helpers/httpErrors";
import { BrevoNotificationGateway } from "./BrevoNotificationGateway";
import { BrevoNotificationGatewayRoutes } from "./BrevoNotificationGateway.routes";
import {
  BrevoHeaders,
  SendTransactEmailRequestBody,
} from "./BrevoNotificationGateway.schemas";

const sender = { name: "bob", email: "Machin@mail.com" };

describe("SendingBlueHtmlNotificationGateway unit", () => {
  describe("sendEmail with skipEmailAllowList false", () => {
    let fakeHttpClient: HttpClient<BrevoNotificationGatewayRoutes>;
    let allowListPredicate;
    let notificationGateway: BrevoNotificationGateway;
    let sentEmails: {
      headers: BrevoHeaders;
      body: SendTransactEmailRequestBody;
    }[];

    beforeEach(() => {
      sentEmails = [];

      fakeHttpClient = {
        sendTransactEmail(email: any) {
          sentEmails.push(email);
        },
      } as unknown as HttpClient<BrevoNotificationGatewayRoutes>;

      allowListPredicate = makeEmailAllowListPredicate({
        emailAllowList: [
          "beneficiary@gmail.com",
          "advisor@gmail.com",
          "establishment-ceo@gmail.com",
          "establishment-cto@gmail.com",
        ],
        skipEmailAllowList: false,
      });

      notificationGateway = new BrevoNotificationGateway(
        {
          httpClient: fakeHttpClient,
          defaultSender: sender,
          blackListedEmailDomains: [],
          emailAllowListPredicate: allowListPredicate,
          generateHtmlOptions: { skipHead: true },
        },
        "fake-api-key",
      );
    });

    it("should throw if no recipient is provided", async () => {
      const triggerSendEmail = () =>
        notificationGateway.sendEmail({
          kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
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
      await notificationGateway.sendEmail({
        kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
        recipients: ["i-am-not-allowed@mail.net"],
        params: {
          scheduleText: "",
        } as any,
      });

      expect(sentEmails).toHaveLength(0);
    });

    it("should filter emails according to predicate", async () => {
      await notificationGateway.sendEmail({
        kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
        recipients: [
          "beneficiary@gmail.com",
          "advisor@gmail.com",
          "i-am-not-allowed@mail.net",
        ],
        params: {
          scheduleText: "",
        } as any,
      });

      expect(sentEmails[0].body.to).toEqual([
        { email: "beneficiary@gmail.com" },
        { email: "advisor@gmail.com" },
      ]);
    });

    it("should filter email and carbon copy according to predicate", async () => {
      const carbonCopy = [
        "establishment-cto@gmail.com",
        "establishment-comptable-not-allowed@gmail.com",
      ];

      await notificationGateway.sendEmail({
        kind: "AGENCY_WAS_ACTIVATED",
        recipients: ["establishment-ceo@gmail.com"],
        cc: carbonCopy,
        params: {
          agencyName: "AGENCY_NAME",
          agencyLogoUrl: "https://beta.gouv.fr/img/logo_twitter_image-2019.jpg",
        },
      });

      expectToEqual(sentEmails[0], {
        headers: {
          "api-key": "fake-api-key",
          "content-type": "application/json",
          accept: "application/json",
        },
        body: {
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
          tags: ["activation prescripteur"],
          subject: "Immersion Facilitée - Votre structure a été activée",
          htmlContent: ignoreTabs(`
      <html lang="fr">
      <body>
      <table 
      width="600" align="center" style="margin-top: 20px">
      <tr>
      <td>
      <table 
      width="600">
      <tr>
      <td 
      width="35%">
      <a 
      href="https://immersion-facile.beta.gouv.fr/">
      <img 
      src="https://immersion.cellar-c2.services.clever-cloud.com/logo-if-mailing.png" 
      width="223" height="108" 
      alt="Immersion Facilitée - République Française"/>
      </a>
      </td>
      <td 
      width="60%" align="right">
      <img 
      src="https://beta.gouv.fr/img/logo_twitter_image-2019.jpg" 
      alt="" style="max-width: 150px; max-height: 120px; height: auto; margin-left: 20px;"/>
      </td>
      </tr>
      <tr>
      <td 
      width="600" height="10" colspan="2"></td>
      </tr>
      <tr>
      <td 
      width="600" height="1" style="background-color:#DDDDDD" colspan="2"></td>
      </tr>
      <tr>
      <td 
      width="600" height="30" colspan="2"></td>
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
      <table 
      width="600">
      <tr>
      <td>
      <p><strong>Votre structure prescriptrice d'immersion est activée !</strong> 
      <br/>
      <br/>Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: AGENCY_NAME. 
      <br/>
      <br/>Merci à vous !</p>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      <tr>
      <td>
      <table 
      width="600">
      <tr>
      <td>
      <p>Bonne journée,
      <br/>L'équipe Immersion Facilitée</p>
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
      <td 
      width="600" style="background-color: #F5F5FE; text-align: center; padding: 20px 50px; ">
      <p style="font-size: 14px;">Vous recevez cet email, car cette adresse email a été renseigné dans une demande de convention sur le site Immersion Facilitée. Si vous rencontrez un problème, la plupart des solutions sont disponibles sur notre <a 
      href="https://aide.immersion-facile.beta.gouv.fr/fr/">centre d'aide</a>. Vous y trouverez également un formulaire de contact pour joindre notre équipe support, qui vous répondra sous les meilleurs délais.</p>
      </td>
      </tr>
      <tr>
      <td align="center" style="padding: 20px;">
      <img 
      src="https://immersion.cellar-c2.services.clever-cloud.com/d0cfdb84-881a-40d5-b228-7e14c185fb68.png" 
      alt="" 
      width="290" />
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
        },
      });
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip("sendEmail with skipEmailAllowList true", () => {
    let fakeHttpClient: HttpClient<BrevoNotificationGatewayRoutes>;
    let allowListPredicate;
    let notificationGateway: BrevoNotificationGateway;
    let sentEmails: {
      headers: BrevoHeaders;
      body: SendTransactEmailRequestBody;
    }[];

    beforeEach(() => {
      sentEmails = [];

      fakeHttpClient = {
        sendTransactEmail(email: any) {
          sentEmails.push(email);
        },
      } as unknown as HttpClient<BrevoNotificationGatewayRoutes>;

      allowListPredicate = makeEmailAllowListPredicate({
        emailAllowList: [],
        skipEmailAllowList: true,
      });

      notificationGateway = new BrevoNotificationGateway(
        {
          httpClient: fakeHttpClient,
          defaultSender: sender,
          blackListedEmailDomains: ["outlook.fr", "hotmail.fr", "live.fr"],
          emailAllowListPredicate: allowListPredicate,
          generateHtmlOptions: { skipHead: true },
        },
        "fake-api-key",
      );
    });

    it("shouldn't send emails to email containing blacklisted domain", async () => {
      await notificationGateway.sendEmail({
        kind: "AGENCY_WAS_ACTIVATED",
        recipients: ["recipient-test@outlook.fr"],
        params: {
          agencyName: "AGENCY_NAME",
          agencyLogoUrl: "https://beta.gouv.fr/img/logo_twitter_image-2019.jpg",
        },
      });
      expectToEqual(sentEmails, []);
    });

    it("should send emails but not to emails containing blacklisted domain", async () => {
      await notificationGateway.sendEmail({
        kind: "AGENCY_WAS_ACTIVATED",
        recipients: ["toto-test@mail.fr", "jean-louis@hotmail.fr"],
        cc: ["cc@live.fr"],
        params: {
          agencyName: "AGENCY_NAME",
          agencyLogoUrl: "https://beta.gouv.fr/img/logo_twitter_image-2019.jpg",
        },
      });

      expect(sentEmails[0]?.body.to[0].email).toBe("toto-test@mail.fr");
      expect(sentEmails[0]?.body.to[1]).toBeUndefined();
      expect(sentEmails[0]?.body.cc).toBeUndefined();
    });
  });
});
