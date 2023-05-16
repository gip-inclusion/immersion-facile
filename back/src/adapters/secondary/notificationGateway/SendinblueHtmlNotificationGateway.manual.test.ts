import { AppConfig } from "../../primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../primary/config/createHttpClientForExternalApi";
import { SendinblueHtmlNotificationGateway } from "./SendinblueHtmlNotificationGateway";
import { sendinblueHtmlNotificationGatewayTargets } from "./SendinblueHtmlNotificationGateway.targets";

describe("SendinblueHtmlNotificationGateway manual", () => {
  let sibGateway: SendinblueHtmlNotificationGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    sibGateway = new SendinblueHtmlNotificationGateway(
      configureCreateHttpClientForExternalApi()(
        sendinblueHtmlNotificationGatewayTargets,
      ),
      (_) => true,
      config.apiKeySendinblue,
      { email: "bob@fake.mail", name: "Bob" },
    );
  });

  it("should send email correctly", async () => {
    await sibGateway.sendEmail({
      type: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: ["recette@immersion-facile.beta.gouv.fr"],
      params: {
        internshipKind: "immersion",
        magicLink: "www.google.com",
        conventionStatusLink: "www.google.com",
        businessName: "Super Corp",
        establishmentRepresentativeName: "Stéphane Le Rep",
        establishmentTutorName: "Joe le tuteur",
        beneficiaryName: "John Doe",
        signatoryName: "John Doe",
        agencyLogoUrl: "http://toto",
      },
    });

    // Please check emails has been received at recette@immersion-facile.beta.gouv.fr
    expect("reached").toBe("reached");
  });

  it("should send SMS correctly", async () => {
    await sibGateway.sendSms({
      phone: "VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER", // Like 33611223344
      kind: "LastReminderForSignatories",
      shortLink:
        "https://immersion-facile.beta.gouv.fr/api/to/gygr669PTEQBiTwfNycBl9nq8Pua3h5D9pv2",
    });

    // Please check SMS has been received at VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER
    expect("reached").toBe("reached");
  });
});
