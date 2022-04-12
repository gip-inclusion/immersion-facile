import { createInMemoryUow } from "../../../adapters/primary/config";
import { AlwaysAllowEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { NewApplicationAdminNotificationParams } from "../../../domain/immersionApplication/ports/EmailGateway";
import { frontRoutes } from "../../../shared/routes";
import { OmitFromExistingKeys } from "../../../shared/utils";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/immersionApplication/useCases/notifications/NotifyToAgencyApplicationSubmitted";

const councellorEmail = "councellor@email.fr";
const councellorEmail2 = "councellor2@email.fr";
const validatorEmail = "validator@mail.com";

const agencyConfigWithCounsellors = AgencyConfigBuilder.create(
  "agency-with-councellors",
)
  .withCounsellorEmails([councellorEmail, councellorEmail2])
  .withName("test-agency-name")
  .build();

const agencyWithOnlyValidator = AgencyConfigBuilder.create(
  "agency-with-only-validator",
)
  .withValidatorEmails([validatorEmail])
  .withName("test-agency-name")
  .build();

describe("NotifyToAgencyApplicationSubmitted", () => {
  let emailGateway: InMemoryEmailGateway;
  let agencyRepository: InMemoryAgencyRepository;
  let notifyToAgencyApplicationSubmitted: NotifyToAgencyApplicationSubmitted;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    const emailFilter = new AlwaysAllowEmailFilter();
    agencyRepository = new InMemoryAgencyRepository();
    agencyRepository.setAgencies([
      agencyConfigWithCounsellors,
      agencyWithOnlyValidator,
    ]);

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      agencyRepo: agencyRepository,
    });

    notifyToAgencyApplicationSubmitted = new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      emailFilter,
      emailGateway,
      fakeGenerateMagicLinkUrlFn,
    );
  });

  it("Sends notification email to agency counsellor when it is initially submitted", async () => {
    const validImmersionApplication = new ImmersionApplicationDtoBuilder()
      .withAgencyId(agencyConfigWithCounsellors.id)
      .build();
    await notifyToAgencyApplicationSubmitted.execute(validImmersionApplication);

    const sentEmails = emailGateway.getSentEmails();

    const expectedParams: OmitFromExistingKeys<
      NewApplicationAdminNotificationParams,
      "magicLink"
    > = {
      agencyName: agencyConfigWithCounsellors.name,
      businessName: validImmersionApplication.businessName,
      dateEnd: validImmersionApplication.dateEnd,
      dateStart: validImmersionApplication.dateStart,
      demandeId: validImmersionApplication.id,
      firstName: validImmersionApplication.firstName,
      lastName: validImmersionApplication.lastName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "NEW_APPLICATION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "counsellor",
            frontRoutes.immersionApplicationsToValidate,
            councellorEmail,
          ),
        },
      },
      {
        type: "NEW_APPLICATION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "counsellor",
            frontRoutes.immersionApplicationsToValidate,
            councellorEmail2,
          ),
        },
      },
    ]);
  });

  it("Sends notification email to agency validator when it is initially submitted, and agency has no counsellor", async () => {
    const validImmersionApplication = new ImmersionApplicationDtoBuilder()
      .withAgencyId(agencyWithOnlyValidator.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validImmersionApplication);

    const sentEmails = emailGateway.getSentEmails();

    const expectedParams: OmitFromExistingKeys<
      NewApplicationAdminNotificationParams,
      "magicLink"
    > = {
      agencyName: agencyConfigWithCounsellors.name,
      businessName: validImmersionApplication.businessName,
      dateEnd: validImmersionApplication.dateEnd,
      dateStart: validImmersionApplication.dateStart,
      demandeId: validImmersionApplication.id,
      firstName: validImmersionApplication.firstName,
      lastName: validImmersionApplication.lastName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "NEW_APPLICATION_AGENCY_NOTIFICATION",
        recipients: [validatorEmail],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "validator",
            frontRoutes.immersionApplicationsToValidate,
            validatorEmail,
          ),
        },
      },
    ]);
  });
});
