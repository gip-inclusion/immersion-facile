import { parseISO } from "date-fns";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { frontRoutes } from "../../../shared/routes";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectEmailAdminNotificationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { AgencyConfig } from "./../../../domain/immersionApplication/ports/AgencyRepository";

const adminEmail = "admin@email.fr";
const validDemandeImmersion = new ImmersionApplicationDtoBuilder().build();

const defaultAgencyConfig = AgencyConfigBuilder.create(
  validDemandeImmersion.agencyCode,
)
  .withName("test-agency-name")
  .build();

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: InMemoryEmailGateway;
  let agencyConfig: AgencyConfig;

  beforeEach(() => {
    agencyConfig = defaultAgencyConfig;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () => {
    return new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      new InMemoryAgencyRepository([agencyConfig]),
      fakeGenerateMagicLinkUrlFn,
    );
  };

  test("Sends no mail when contact Email is not set", async () => {
    await createUseCase().execute(validDemandeImmersion);
    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  test("Sends admin notification email to immersion facile team when contact Email is set", async () => {
    agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
      .withAdminEmails([adminEmail])
      .build();

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectEmailAdminNotificationMatchingImmersionApplication(sentEmails[0], {
      recipients: [adminEmail],
      immersionApplication: {
        ...validDemandeImmersion,
        dateStart: parseISO(validDemandeImmersion.dateStart).toLocaleDateString(
          "fr",
        ),
        dateEnd: parseISO(validDemandeImmersion.dateEnd).toLocaleDateString(
          "fr",
        ),
      },
      magicLink: fakeGenerateMagicLinkUrlFn(
        validDemandeImmersion.id,
        "admin",
        frontRoutes.immersionApplicationsToValidate,
      ),
      agencyConfig,
    });
  });
});
