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
      kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: ["recette@immersion-facile.beta.gouv.fr"],
      params: {
        conventionId: "CONVENTION_ID",
        internshipKind: "immersion",
        conventionSignShortlink: "www.google.com",
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
      recipientPhone: "VALID_INTERNATIONAL_FRENCH_MOBILE_PHONE_NUMBER", // Like 33611223344
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
            recipientPhone: phone,
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

  it("should retrieve attachment content correctly", async () => {
    const downloadToken =
      "eyJmb2xkZXIiOiIyMDIzMDcxMzEyMTcxNS45Mi40Mjg0MDQyMiIsImZpbGVuYW1lIjoiaWYtbG9nby1wZS1pby5wbmcifQ";
    const content = await notificationGateway.getAttachmentContent(
      downloadToken,
    );
    expect(content.toString("base64")).toBe(ifLogoInBase64);
  });

  it("should send email with attachment correctly", async () => {
    const response = await notificationGateway.sendEmail({
      kind: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: ["recette@immersion-facile.beta.gouv.fr"],
      params: {
        businessAddress: "1 rue de la paix",
        businessName: "Super Corp",
        editFrontUrl: "www.google.com",
      },
      attachments: [
        {
          name: "if-logo-pe-io.png",
          content: ifLogoInBase64,
        },
      ],
    });
    // should check on mail client for
    expect(response).toBeUndefined();
  });
});

const ifLogoInBase64 =
  "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";
