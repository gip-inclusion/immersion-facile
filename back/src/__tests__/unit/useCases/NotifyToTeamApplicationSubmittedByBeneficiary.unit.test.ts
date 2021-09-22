import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { expectEmailAdminNotificationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/demandeImmersion/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: InMemoryEmailGateway;
  let immersionFacileContactEmail: string;
  const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

  beforeEach(() => {
    immersionFacileContactEmail = "supervisor@email.fr";
    emailGw = new InMemoryEmailGateway();
  });

  test("Sends no mail when contact Email is not set", async () => {
    const notifyToTeam = new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      undefined,
    );
    await notifyToTeam.execute(validDemandeImmersion);
    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  test("Sends admin notification email to immersion facile team when contact Email is set", async () => {
    const notifyToTeam = new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      immersionFacileContactEmail,
    );
    await notifyToTeam.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectEmailAdminNotificationMatchingImmersionApplication(sentEmails[0], {
      recipient: immersionFacileContactEmail,
      immersionApplication: validDemandeImmersion,
    });
  });
});
