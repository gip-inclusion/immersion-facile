import { ignoreTabs } from "html-templates";
import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { HttpClient } from "shared-routes";
import { makeEmailAllowListPredicate } from "../../../../config/bootstrap/appConfig";
import { BrevoHeaders } from "../../../../utils/apiBrevoUrl";
import { BrevoNotificationGateway } from "./BrevoNotificationGateway";
import { BrevoNotificationGatewayRoutes } from "./BrevoNotificationGateway.routes";
import { SendTransactEmailRequestBody } from "./BrevoNotificationGateway.schemas";

const sender = { name: "bob", email: "Machin@mail.com" };

describe("SendingBlueHtmlNotificationGateway unit", () => {
  describe("sendEmail with skipEmailAllowList false", () => {
    let fakeHttpClient: HttpClient<BrevoNotificationGatewayRoutes>;
    let allowListPredicate: (email: string) => boolean;
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
        errors.notification.missingRecipient(),
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
          refersToOtherAgency: false,
          agencyReferdToName: undefined,
          users: [
            {
              firstName: "Jean",
              lastName: "Dupont",
              email: "jean-dupont@gmail.com",
              agencyName: "Agence du Grand Est",
              isNotifiedByEmail: true,
              roles: ["validator"],
            },

            {
              firstName: "Jeanne",
              lastName: "Dupont",
              email: "jeanne-dupont@gmail.com",
              agencyName: "Agence du Grand Est",
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          ],
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
      <p><strong>Votre organisme prescripteur AGENCY_NAME est activée sur Immersion facilitée !</strong> 
      <br/>
      <br/>Vous pouvez dès à présent valider les conventions dématérialisées sur Immersion Facilitée.
      <br/>
      <br/><strong>Voici les différents utilisateurs rattachés à la structure et leur rôles :</strong>
      <br/>
      <br/>Chaque utilisateur peut se créer un espace personnel afin de voir, pré-valider ou valider et piloter ses conventions, en fonction de ses droits.
      <br/>false
      <br/>
      <br/><ul style=\"list-style-type: none; border: 1px solid #ddd; padding: 16px;\"><li><strong>Jean Dupont - jean-dupont@gmail.com</strong></li>
      <br/><li><strong>Valideur</strong> (peut valider des conventions de l’agence et modifier leur statut)</li>
      <br/><li>Reçoit les emails de toutes les conventions de  Agence du Grand Est</li>
      <br/><li><a 
      href=\"https://immersion-facile.beta.gouv.fr/tableau-de-bord-agence\" 
      target=\"_blank\">Espace personnel</a></li></ul>
      <br/>
      <br/><ul style=\"list-style-type: none; border: 1px solid #ddd; padding: 16px;\"><li><strong>Jeanne Dupont - jeanne-dupont@gmail.com</strong></li>
      <br/><li><strong>Pré-Valideur</strong> (peut pré-valider les conventions de l’agence et modifier leur statut)</li>
      <br/><li>Reçoit les emails de toutes les conventions de  Agence du Grand Est</li>
      <br/><li><a 
      href=\"https://immersion-facile.beta.gouv.fr/tableau-de-bord-agence\" 
      target=\"_blank\">Espace personnel</a></li></ul>
      <br/>
      <br/>
      <br/>
      <br/>Participez à l'un de nos <strong>webinaires dédiés aux prescripteurs</strong> pour être accompagné par notre équipe.
      <br/>
      <br/>Au programme :
      <br/>• Comment établir une convention d'immersion
      <br/>• Découvrir le tableau de bord</p>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      <tr>
      <td>
      <table>
      <tr>
      <td 
      align=\"center\" 
      width=\"600\"
      style=\"padding: 20px; padding-top: 10px; padding-bottom: 30px;\"
      >
      <a
      style=\"text-decoration: none; display: inline-block; padding: 10px 20px; text-align: center; background-color: #000091; color: #fff;\"
      href=\"https://app.livestorm.co/itou/decouvrir-immersion-facilitee?s=0aae9824-c7e1-4aba-996a-46bc5f1d4488\"
      >
      Je m'inscris au webinaire
      </a>
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
      href="https://immersion-facile.beta.gouv.fr/aide/">centre d'aide</a>. Vous y trouverez également un formulaire de contact pour joindre notre équipe support, qui vous répondra sous les meilleurs délais.</p>
      </td>
      </tr>
      <tr>
      <td align="center" style="padding: 20px;">
      <img 
      src="https://immersion.cellar-c2.services.clever-cloud.com/email_footer.png" 
      alt=""/>
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
          attachment: [
            {
              url: "https://immersion.cellar-c2.services.clever-cloud.com/Fiche memo prescripteur-Role-des-prescripteurs-et-couverture-des risques-immersionfacilitee2024.pdf",
            },
          ],
        },
      });
    });
  });

  describe("sendEmail with skipEmailAllowList true", () => {
    let fakeHttpClient: HttpClient<BrevoNotificationGatewayRoutes>;
    let allowListPredicate: (email: string) => boolean;
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
          refersToOtherAgency: false,
          agencyReferdToName: undefined,
          users: [
            {
              firstName: "Jean",
              lastName: "Dupont",
              email: "jean-dupont@gmail.com",
              agencyName: "Agence du Grand Est",
              isNotifiedByEmail: true,
              roles: ["validator"],
            },

            {
              firstName: "Jeanne",
              lastName: "Dupont",
              email: "jeanne-dupont@gmail.com",
              agencyName: "Agence du Grand Est",
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          ],
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
          refersToOtherAgency: false,
          agencyReferdToName: undefined,
          users: [
            {
              firstName: "Jean",
              lastName: "Dupont",
              email: "jean-dupont@gmail.com",
              agencyName: "Agence du Grand Est",
              isNotifiedByEmail: true,
              roles: ["validator"],
            },

            {
              firstName: "Jeanne",
              lastName: "Dupont",
              email: "jeanne-dupont@gmail.com",
              agencyName: "Agence du Grand Est",
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          ],
        },
      });

      expect(sentEmails[0]?.body.to[0].email).toBe("toto-test@mail.fr");
      expect(sentEmails[0]?.body.to[1]).toBeUndefined();
      expect(sentEmails[0]?.body.cc).toBeUndefined();
    });
  });
});
