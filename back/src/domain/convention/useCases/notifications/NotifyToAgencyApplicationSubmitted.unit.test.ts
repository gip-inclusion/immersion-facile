import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
  frontRoutes,
  PeConnectIdentity,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { DeterministShortLinkIdGeneratorGateway } from "../../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { makeShortLinkUrl } from "../../../core/ShortLink";
import { NotifyToAgencyApplicationSubmitted } from "./NotifyToAgencyApplicationSubmitted";

describe("NotifyToAgencyApplicationSubmitted", () => {
  const councellorEmail = "councellor@email.fr";
  const councellorEmail2 = "councellor2@email.fr";
  const validatorEmail = "validator@mail.com";

  const agencyWithCounsellors = AgencyDtoBuilder.create(
    "agency-with-councellors",
  )
    .withCounsellorEmails([councellorEmail, councellorEmail2])
    .withName("test-agency-name")
    .build();

  const agencyWithOnlyValidator = AgencyDtoBuilder.create(
    "agency-with-only-validator",
  )
    .withValidatorEmails([validatorEmail])
    .withName("test-agency-name")
    .build();

  const agencyWithConsellorsAndValidator = AgencyDtoBuilder.create(
    "agency-with-councellors-and-validator",
  )
    .withCounsellorEmails([councellorEmail, councellorEmail2])
    .withValidatorEmails([validatorEmail])
    .withName("test-agency-name")
    .build();
  const agencyPeWithCouncellors = AgencyDtoBuilder.create(
    "agency-pe-with-councellors",
  )
    .withCounsellorEmails([councellorEmail, councellorEmail2])
    .withKind("pole-emploi")
    .withName("test-agency-name")
    .build();

  const expectedParams = (agency: AgencyDto, convention: ConventionDto) => ({
    agencyName: agency.name,
    businessName: convention.businessName,
    dateEnd: convention.dateEnd,
    dateStart: convention.dateStart,
    conventionId: convention.id,
    firstName: convention.signatories.beneficiary.firstName,
    lastName: convention.signatories.beneficiary.lastName,
  });

  let notificationGateway: InMemoryNotificationGateway;
  let notifyToAgencyApplicationSubmitted: NotifyToAgencyApplicationSubmitted;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let config: AppConfig;
  const timeGateway = new CustomTimeGateway();

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    notificationGateway = new InMemoryNotificationGateway();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([
      agencyWithCounsellors,
      agencyWithOnlyValidator,
      agencyWithConsellorsAndValidator,
      agencyPeWithCouncellors,
    ]);

    const uowPerformer = new InMemoryUowPerformer({
      ...uow,
    });

    notifyToAgencyApplicationSubmitted = new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      notificationGateway,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      shortLinkIdGeneratorGateway,
      config,
    );
  });

  it("Sends notification email to agency counsellor when it is initially submitted", async () => {
    const shortLinkIds = [
      "shortLink1",
      "shortLink2",
      "shortLink3",
      "shortLink4",
    ];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithCounsellors.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        email: councellorEmail,
        now: timeGateway.now(),
        targetRoute: frontRoutes.manageConvention,
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        email: councellorEmail2,
        now: timeGateway.now(),
        targetRoute: frontRoutes.manageConvention,
      }),
      [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        email: councellorEmail,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),

      [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        email: councellorEmail2,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
    });

    expectToEqual(notificationGateway.getSentEmails(), [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithCounsellors, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
          agencyLogoUrl: agencyWithCounsellors.logoUrl,
          warning: undefined,
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithCounsellors, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
          agencyLogoUrl: agencyWithCounsellors.logoUrl,
          warning: undefined,
        },
      },
    ]);
  });

  it("Sends notification email to agency validator when it is initially submitted, and agency has no counsellor", async () => {
    const shortLinkIds = ["shortlink1", "shortlink2"];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithOnlyValidator.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "validator",
        email: validatorEmail,
        now: timeGateway.now(),
        targetRoute: frontRoutes.manageConvention,
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "validator",
        email: validatorEmail,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
    });

    expectToEqual(notificationGateway.getSentEmails(), [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [validatorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithCounsellors, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
          agencyLogoUrl: agencyWithCounsellors.logoUrl,
        },
      },
    ]);
  });

  it("Sends notification email only counsellors with agency that have validators and counsellors", async () => {
    const shortLinkIds = [
      "shortlink1",
      "shortlink2",
      "shortlink3",
      "shortlink4",
    ];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithConsellorsAndValidator.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.manageConvention,
        email: councellorEmail,
        now: timeGateway.now(),
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.manageConvention,
        email: councellorEmail2,
        now: timeGateway.now(),
      }),
      [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellorEmail,
        now: timeGateway.now(),
      }),
      [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellorEmail2,
        now: timeGateway.now(),
      }),
    });

    expectToEqual(notificationGateway.getSentEmails(), [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
        },
      },
    ]);
  });
  it("Sends notification email to agency with warning when beneficiary is PeConnected and beneficiary has no PE advisor", async () => {
    const shortLinkIds = [
      "shortlink1",
      "shortlink2",
      "shortlink3",
      "shortlink4",
    ];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
    const peIdentity: PeConnectIdentity = {
      provider: "peConnect",
      token: "123",
    };
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyPeWithCouncellors.id)
      .withFederatedIdentity(peIdentity)
      .build();

    uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      [
        {
          conventionId: validConvention.id,
          peExternalId: peIdentity.token,
          _entityName: "ConventionPoleEmploiAdvisor",
          advisor: undefined,
        },
      ],
    );

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.manageConvention,
        email: councellorEmail,
        now: timeGateway.now(),
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.manageConvention,
        email: councellorEmail2,
        now: timeGateway.now(),
      }),
      [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellorEmail,
        now: timeGateway.now(),
      }),
      [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellorEmail2,
        now: timeGateway.now(),
      }),
    });

    expectToEqual(notificationGateway.getSentEmails(), [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          warning: `Merci de vérifier le conseiller référent associé à ce bénéficiaire.`,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
          conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
          warning: `Merci de vérifier le conseiller référent associé à ce bénéficiaire.`,
        },
      },
    ]);
  });
});
