import { AppConfig } from "../../primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../primary/config/createHttpClientForExternalApi";
import { BrevoNotificationGateway } from "./BrevoNotificationGateway";
import { brevoNotificationGatewayTargets } from "./BrevoNotificationGateway.targets";

describe("BrevoNotificationGateway manual", () => {
  let notificationGateway: BrevoNotificationGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    notificationGateway = new BrevoNotificationGateway(
      configureCreateHttpClientForExternalApi()(
        brevoNotificationGatewayTargets,
      ),
      (_) => true,
      config.apiKeyBrevo,
      { email: "bob@fake.mail", name: "Bob" },
    );
  });

  it("should send email correctly", async () => {
    await notificationGateway.sendEmail({
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
    await notificationGateway.sendSms({
      recipient: "VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER", // Like 33611223344
      kind: "LastReminderForSignatories",
      params: {
        shortLink:
          "https://immersion-facile.beta.gouv.fr/api/to/gygr669PTEQBiTwfNycBl9nq8Pua3h5D9pv2",
      },
    });

    // Please check SMS has been received at VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER
    expect("reached").toBe("reached");
  });

  const times = 50;
  it(
    `should send ${times} SMS with rate correctly`,
    async () => {
      const phones = [];

      for (let i = 0; i < times; i++)
        phones.push("VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER"); // Like 33611223344
      await Promise.all(
        phones.map((phone, index) =>
          notificationGateway.sendSms({
            recipient: phone,
            kind: "LastReminderForSignatories",
            params: {
              shortLink: `https://test-sms-${index + 1}`,
            },
          }),
        ),
      );

      // Please check SMS has been received at VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER
      expect("reached").toBe("reached");
    },
    1100 * times,
  );
});
