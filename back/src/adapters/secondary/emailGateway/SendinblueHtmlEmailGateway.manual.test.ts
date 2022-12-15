import axios from "axios";
import { AppConfig } from "../../primary/config/appConfig";

import { SendinblueHtmlEmailGateway } from "./SendinblueHtmlEmailGateway";

describe("SendingBlueHtmlEmailGateway manual", () => {
  let sibGateway: SendinblueHtmlEmailGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    sibGateway = new SendinblueHtmlEmailGateway(
      axios,
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
        magicLink: "www.google.com",
        conventionStatusLink: "www.google.com",
        businessName: "Super Corp",
        establishmentRepresentativeName: "Stéphane Le Rep",
        beneficiaryName: "John Doe",
        signatoryName: "John Doe",
      },
    });

    // Please check emails has been received at recette@immersion-facile.beta.gouv.fr
    expect("reached").toBe("reached");
  });
});
