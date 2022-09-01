import axios from "axios";
import { AppConfig } from "../../primary/config/appConfig";

import { SendinblueEmailGateway } from "./SendinblueEmailGateway";

describe("SendingBlueEmailGateway manual", () => {
  let sibGateway: SendinblueEmailGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    sibGateway = new SendinblueEmailGateway(
      axios,
      (_) => true,
      config.apiKeySendinblue,
    );
  });

  it("should send email correctly", async () => {
    await sibGateway.sendEmail({
      type: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: ["recette+test-etablissement@immersion-facile.beta.gouv.fr"],
      params: { editFrontUrl: "some-fake-url" },
    });

    // Please check emails has been received at recette@immersion-facile.beta.gouv.fr
    expect("reached").toBe("reached");
  });

  it("should send email correctly even with cc field as []", async () => {
    await sibGateway.sendEmail({
      type: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: ["recette+test-etablissement@immersion-facile.beta.gouv.fr"],
      cc: [],
      params: { editFrontUrl: "some-fake-url" },
    });

    // Please check emails has been received at recette@immersion-facile.beta.gouv.fr
    expect("reached").toBe("reached");
  });
});
