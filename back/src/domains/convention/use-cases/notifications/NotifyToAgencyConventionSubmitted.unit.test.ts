import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type AgencyWithUsersRights,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type FtConnectIdentity,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  makeUrlWithQueryParams,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import type { ConventionFtUserAdvisorEntity } from "../../../core/authentication/ft-connect/dto/FtConnect.dto";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyToAgencyConventionSubmitted } from "./NotifyToAgencyConventionSubmitted";

describe("NotifyToAgencyConventionSubmitted", () => {
  const validator = new ConnectedUserBuilder()
    .withId("validator-id")
    .withFirstName("validatorName")
    .withLastName("validatorLastName")
    .withEmail("validator@mail.com")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "validator-external-id",
      siret: "11111222225555",
    })
    .build();

  const councellor1 = new ConnectedUserBuilder()
    .withId("councellor1-id")
    .withFirstName("councellor1Name")
    .withLastName("councellor1LastName")
    .withEmail("councellor1@email.fr")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "validator-external-id",
      siret: "11111222223333",
    })
    .build();

  const councellor2 = new ConnectedUserBuilder()
    .withId("councellor2-id")
    .withFirstName("councellor2Name")
    .withLastName("councellor2LastName")
    .withEmail("councellor2@email.fr")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "validator-external-id",
      siret: "11111222227777",
    })
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
  const agencyFtWithCounsellors = toAgencyWithRights(
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
    firstName: getFormattedFirstnameAndLastname({
      firstname: convention.signatories.beneficiary.firstName,
    }),
    lastName: getFormattedFirstnameAndLastname({
      lastname: convention.signatories.beneficiary.lastName,
    }),
  });

  let notifyToAgencyConventionSubmitted: NotifyToAgencyConventionSubmitted;
  let uow: InMemoryUnitOfWork;
  let config: AppConfig;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  const timeGateway = new CustomTimeGateway();

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    uow = createInMemoryUow();
    uow.agencyRepository.agencies = [
      agencyWithOnlyValidator,
      agencyWithConsellorsAndValidator,
      agencyFtWithCounsellors,
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
      config,
    );
  });

  it("Sends notification email to agency validator when it is initially submitted, and agency has no counsellor", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithOnlyValidator.id)
      .build();

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

    const magicLink: AbsoluteUrl = `${config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
      `/${frontRoutes.manageConventionUserConnected}`,
      { conventionId: validConvention.id },
    )}`;

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [validator.email],
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              validConvention.agencyReferent ?? {},
            ),
            internshipKind: validConvention.internshipKind,
            ...expectedParams(agencyWithOnlyValidator, validConvention),
            magicLink,
            agencyLogoUrl: agencyWithOnlyValidator.logoUrl ?? undefined,
          },
        },
      ],
    });
  });

  it("Sends notification email only counsellors with agency that have validators and counsellors", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithConsellorsAndValidator.id)
      .build();

    const magicLink: AbsoluteUrl = `${config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
      `/${frontRoutes.manageConventionUserConnected}`,
      { conventionId: validConvention.id },
    )}`;

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellor1.email],
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              validConvention.agencyReferent ?? {},
            ),
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink,
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellor2.email],
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              validConvention.agencyReferent ?? {},
            ),
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink,
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
      ],
    });
  });

  it("Sends notification email to agency with warning when beneficiary is PeConnected and beneficiary has no PE advisor", async () => {
    const ftIdentity: FtConnectIdentity = {
      provider: "peConnect",
      token: "123",
    };
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyFtWithCounsellors.id)
      .withFederatedIdentity(ftIdentity)
      .build();

    const magicLink: AbsoluteUrl = `${config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
      `/${frontRoutes.manageConventionUserConnected}`,
      { conventionId: validConvention.id },
    )}`;

    uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
      [
        {
          conventionId: validConvention.id,
          peExternalId: ftIdentity.token,
          _entityName: "ConventionFranceTravailAdvisor",
          advisor: undefined,
        },
      ],
    );

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellor1.email],
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              validConvention.agencyReferent ?? {},
            ),
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink,
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
            warning:
              "Merci de vérifier le conseiller référent associé à ce bénéficiaire.",
          },
        },
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [councellor2.email],
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              validConvention.agencyReferent ?? {},
            ),
            internshipKind: validConvention.internshipKind,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink,
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
    const ftAdvisorEmail = "ft-advisor@gmail.com";
    const ftIdentity: FtConnectIdentity = {
      provider: "peConnect",
      token: "123",
    };

    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyFtWithCounsellors.id)
      .withFederatedIdentity(ftIdentity)
      .build();

    const magicLink: AbsoluteUrl = `${config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
      `/${frontRoutes.manageConventionUserConnected}`,
      { conventionId: validConvention.id },
    )}`;

    const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
      _entityName: "ConventionFranceTravailAdvisor",
      advisor: {
        email: ftAdvisorEmail,
        firstName: "Elsa",
        lastName: "Oldenburg",
        type: "CAPEMPLOI",
      },
      peExternalId: ftIdentity.token,
      conventionId: validConvention.id,
    };

    uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
      [userConventionAdvisor],
    );

    await notifyToAgencyConventionSubmitted.execute({
      convention: validConvention,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [ftAdvisorEmail],
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              validConvention.agencyReferent ?? {},
            ),
            internshipKind: validConvention.internshipKind,
            warning: undefined,
            ...expectedParams(
              agencyWithConsellorsAndValidator,
              validConvention,
            ),
            magicLink,
            agencyLogoUrl:
              agencyWithConsellorsAndValidator.logoUrl ?? undefined,
          },
        },
      ],
    });
  });
});
