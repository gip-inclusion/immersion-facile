import { parseISO } from "date-fns";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/convention/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { frontRoutes } from "shared/src/routes";
import { AgencyDtoBuilder } from "../../../../../shared/src/agency/AgencyDtoBuilder";
import { expectEmailAdminNotificationMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { AgencyDto } from "shared/src/agency/agency.dto";

const adminEmail = "admin@email.fr";
const validConvention = new ConventionDtoBuilder().build();

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId)
  .withName("test-agency-name")
  .build();

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: InMemoryEmailGateway;
  let agency: AgencyDto;

  beforeEach(() => {
    agency = defaultAgency;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () =>
    new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      new InMemoryAgencyRepository([agency]),
      fakeGenerateMagicLinkUrlFn,
    );

  it("Sends no mail when contact Email is not set", async () => {
    await createUseCase().execute(validConvention);
    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  it("Sends admin notification email to immersion facile team when contact Email is set", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withAdminEmails([adminEmail])
      .build();

    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectEmailAdminNotificationMatchingConvention(sentEmails[0], {
      recipient: adminEmail,
      convention: {
        ...validConvention,
        dateStart: parseISO(validConvention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(validConvention.dateEnd).toLocaleDateString("fr"),
      },
      magicLink: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "admin",
        targetRoute: frontRoutes.conventionToValidate,
        email: "admin@if.fr",
      }),
      agency,
    });
  });
});
