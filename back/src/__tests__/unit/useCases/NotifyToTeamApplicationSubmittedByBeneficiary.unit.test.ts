import {
  AgencyConfigs,
  InMemoryAgencyRepository,
} from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectEmailAdminNotificationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";

const adminEmail = "admin@email.fr";
const validDemandeImmersion = new ImmersionApplicationDtoBuilder().build();

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: InMemoryEmailGateway;
  let agencyConfigs: AgencyConfigs;

  beforeEach(() => {
    agencyConfigs = {
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty().build(),
    };
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () => {
    return new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      new InMemoryAgencyRepository(agencyConfigs),
    );
  };

  test("Sends no mail when contact Email is not set", async () => {
    await createUseCase().execute(validDemandeImmersion);
    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  test("Sends admin notification email to immersion facile team when contact Email is set", async () => {
    agencyConfigs[validDemandeImmersion.agencyCode] =
      AgencyConfigBuilder.empty().withAdminEmails([adminEmail]).build();

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectEmailAdminNotificationMatchingImmersionApplication(sentEmails[0], {
      recipients: [adminEmail],
      immersionApplication: validDemandeImmersion,
    });
  });
});
