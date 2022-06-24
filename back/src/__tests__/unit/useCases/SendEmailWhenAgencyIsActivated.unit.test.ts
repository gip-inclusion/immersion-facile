import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { SendEmailWhenAgencyIsActivated } from "../../../domain/convention/useCases/SendEmailWhenAgencyIsActivated";

describe("SendEmailWhenAgencyIsActivated", () => {
  it("Sends an email to validators with agency name", async () => {
    // Prepare
    const emailGateway = new InMemoryEmailGateway();
    const useCase = new SendEmailWhenAgencyIsActivated(emailGateway);
    const updatedAgency = AgencyDtoBuilder.create()
      .withValidatorEmails(["toto@email.com"])
      .withName("just-activated-agency")
      .build();

    // Act
    await useCase.execute(updatedAgency);

    // Assert
    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expect(sentEmails[0].type).toBe("AGENCY_WAS_ACTIVATED");
    expect(sentEmails[0].params).toEqual({
      agencyName: "just-activated-agency",
    });
    expect(sentEmails[0].recipients).toEqual(["toto@email.com"]);
  });
});
