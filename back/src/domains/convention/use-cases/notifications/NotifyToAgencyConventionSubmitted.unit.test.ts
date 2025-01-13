import {
  AgencyDtoBuilder,
  AgencyWithUsersRights,
  ConventionDto,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  PeConnectIdentity,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { ConventionFtUserAdvisorEntity } from "../../../core/authentication/pe-connect/dto/FtConnect.dto";
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
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator-id")
    .withFirstName("validatorName")
    .withLastName("validatorLastName")
    .withEmail("validator@mail.com")
    .withCreatedAt(new Date())
    .withExternalId("validator-external-id")
    .build();

  const councellor1 = new InclusionConnectedUserBuilder()
    .withId("councellor1-id")
    .withFirstName("councellor1Name")
    .withLastName("councellor1LastName")
    .withEmail("councellor1@email.fr")
    .withCreatedAt(new Date())
    .withExternalId("councellor1-external-id")
    .build();

  const councellor2 = new InclusionConnectedUserBuilder()
    .withId("councellor2-id")
    .withFirstName("councellor2Name")
    .withLastName("councellor2LastName")
    .withEmail("councellor2@email.fr")
    .withCreatedAt(new Date())
    .withExternalId("councellor2-external-id")
    .build();

  const agencyWithOnlyValidator = toAgencyWithRights(
    AgencyDtoBuilder.create("agency-with-only-validator")
      .withName("test-agency-name")
      .build(),
    {
      [validator.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    },
  );

  const agencyWithConsellorsAndValidator = toAgencyWithRights(
    AgencyDtoBuilder.create("agency-with-councellors-and-validator")

      .withName("test-agency-name")
      .build(),
    {
      [validator.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
      [councellor1.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
      [councellor2.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
    },
  );
  const agencyPeWithCouncellors = toAgencyWithRights(
    AgencyDtoBuilder.create("agency-pe-with-councellors")

      .withKind("pole-emploi")
      .withName("test-agency-name")
      .build(),
    {
      [councellor1.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
      [councellor2.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
    },
  );

  const expectedParams = (
    agency: AgencyWithUsersRights,
    convention: ConventionDto,
  ) => ({
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
    uow.agencyRepository.agencies = [
      agencyWithOnlyValidator,
      agencyWithConsellorsAndValidator,
      agencyPeWithCouncellors,
    ];
    uow.userRepository.users = [validator, councellor1, councellor2];
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
        email: validator.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.manageConvention,
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "validator",
        email: validator.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [validator.email],
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
        email: councellor1.email,
        now: timeGateway.now(),
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.manageConvention,
        email: councellor2.email,
        now: timeGateway.now(),
      }),
      [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellor1.email,
        now: timeGateway.now(),
      }),
      [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellor2.email,
        now: timeGateway.now(),
      }),
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellor1.email],
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
          recipients: [councellor2.email],
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
          _entityName: "ConventionFranceTravailAdvisor",
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
        email: councellor1.email,
        now: timeGateway.now(),
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.manageConvention,
        email: councellor2.email,
        now: timeGateway.now(),
      }),
      [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellor1.email,
        now: timeGateway.now(),
      }),
      [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: "counsellor",
        targetRoute: frontRoutes.conventionStatusDashboard,
        email: councellor2.email,
        now: timeGateway.now(),
      }),
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellor1.email],
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
          recipients: [councellor2.email],
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

    const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
      _entityName: "ConventionFranceTravailAdvisor",
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
