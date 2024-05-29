import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  PeConnectIdentity,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../core/authentication/pe-connect/dto/PeConnect.dto";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyToAgencyConventionSubmitted } from "./NotifyToAgencyConventionSubmitted";

describe("NotifyToAgencyConventionSubmitted", () => {
  const councellorEmail = "councellor@email.fr";
  const councellorEmail2 = "councellor2@email.fr";
  const validatorEmail = "validator@mail.com";

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

  let notifyToAgencyConventionSubmitted: NotifyToAgencyConventionSubmitted;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let config: AppConfig;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  const timeGateway = new CustomTimeGateway();

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([
      agencyWithOnlyValidator,
      agencyWithConsellorsAndValidator,
      agencyPeWithCouncellors,
    ]);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    const uowPerformer = new InMemoryUowPerformer({
      ...uow,
    });

    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    notifyToAgencyConventionSubmitted = new NotifyToAgencyConventionSubmitted(
      uowPerformer,
      saveNotificationAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      shortLinkIdGeneratorGateway,
      config,
    );
  });

  it("Sends notification email to agency validator when it is initially submitted, and agency has no counsellor", async () => {
    const shortLinkIds = ["shortlink1", "shortlink2"];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithOnlyValidator.id)
      .build();

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

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

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [validatorEmail],
          params: {
            internshipKind: validConvention.internshipKind,
            ...expectedParams(agencyWithOnlyValidator, validConvention),
            magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
            conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
            agencyLogoUrl: agencyWithOnlyValidator.logoUrl ?? undefined,
          },
        },
      ],
    });
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

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

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

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellorEmail],
          params: {
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
            conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellorEmail2],
          params: {
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
            conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
      ],
    });
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

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

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

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellorEmail],
          params: {
            internshipKind: validConvention.internshipKind,
            warning:
              "Merci de vérifier le conseiller référent associé à ce bénéficiaire.",
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
            conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellorEmail2],
          params: {
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
            conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
            warning:
              "Merci de vérifier le conseiller référent associé à ce bénéficiaire.",
          },
        },
      ],
    });
  });

  it("Sends notification email only to peAdvisor when beneficiary is PeConnected and beneficiary has PE advisor", async () => {
    const shortLinkIds = ["shortlink1", "shortlink2"];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

    const peAdvisorEmail = "pe-advisor@gmail.com";
    const peIdentity: PeConnectIdentity = {
      provider: "peConnect",
      token: "123",
    };

    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyPeWithCouncellors.id)
      .withFederatedIdentity(peIdentity)
      .build();

    const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
      _entityName: "ConventionPoleEmploiAdvisor",
      advisor: {
        email: peAdvisorEmail,
        firstName: "Elsa",
        lastName: "Oldenburg",
        type: "CAPEMPLOI",
      },
      peExternalId: peIdentity.token,
      conventionId: validConvention.id,
    };

    uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      [userConventionAdvisor],
    );

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "validator",
        targetRoute: frontRoutes.manageConvention,
        email: peAdvisorEmail,
        now: timeGateway.now(),
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "validator",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: peAdvisorEmail,
        now: timeGateway.now(),
      }),
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [peAdvisorEmail],
          params: {
            internshipKind: validConvention.internshipKind,
            warning: undefined,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
            conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
      ],
    });
  });
});
