import {
  type AgencyWithUsersRights,
  type ConventionDto,
  ConventionDtoBuilder,
  frontRoutes,
  reasonableSchedule,
} from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { FtUserAndAdvisor } from "../dto/FtConnect.dto";
import type { FtConnectImmersionAdvisorDto } from "../dto/FtConnectAdvisor.dto";
import { NotifyFranceTravailUserAdvisorOnConventionFullySigned } from "./NotifyFranceTravailUserAdvisorOnConventionFullySigned";

describe("NotifyFranceTravailUserAdvisorOnConventionFullySigned", () => {
  const conventionId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
  const userFtExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
  const advisor: FtConnectImmersionAdvisorDto = {
    email: "elsa.oldenburg@pole-emploi.net",
    firstName: "Elsa",
    lastName: "Oldenburg",
    type: "CAPEMPLOI",
  };
  const userAdvisorDto: FtUserAndAdvisor = {
    advisor,
    user: {
      peExternalId: userFtExternalId,
      email: "",
      firstName: "",
      isJobseeker: true,
      lastName: "",
    },
  };

  let uow: InMemoryUnitOfWork;
  let notifyFranceTravailUserAdvisorOnConventionFullySigned: NotifyFranceTravailUserAdvisorOnConventionFullySigned;
  let agency: AgencyWithUsersRights;
  const timeGateway = new CustomTimeGateway();
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    agency = uow.agencyRepository.agencies[0];
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    notifyFranceTravailUserAdvisorOnConventionFullySigned =
      new NotifyFranceTravailUserAdvisorOnConventionFullySigned(
        new InMemoryUowPerformer(uow),
        saveNotificationAndRelatedEvent,
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
      );
  });

  it("should resolve to undefined if the convention France Travail OAuth advisor is not found", async () => {
    const conventionDtoFromEvent: ConventionDto = new ConventionDtoBuilder()
      .withId("add5c20e-6dd2-45af-affe-927358005251")
      .withFederatedIdentity({ provider: "peConnect", token: "blop" })
      .build();

    expect(
      await notifyFranceTravailUserAdvisorOnConventionFullySigned.execute({
        convention: conventionDtoFromEvent,
      }),
    ).toBeUndefined();
  });

  it("should send email with the correct params", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withAgencyId(agency.id)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .withBeneficiaryFirstName("John")
      .withBeneficiaryLastName("Doe")
      .withBeneficiaryEmail("john.doe@plop.fr")
      .withImmersionAddress("127 Avenue de la République 94800 Villejuif")
      .withDateStart("2022-07-06")
      .withDateEnd("2022-07-30")
      .withSchedule((interval) =>
        reasonableSchedule(interval, ["samedi", "dimanche"]),
      )
      .withBusinessName("Boulangerie Les Echarts")
      .build();

    uow.conventionRepository.setConventions([conventionDtoFromEvent]);
    uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
      [
        {
          peExternalId: userAdvisorDto.user.peExternalId,
          advisor: userAdvisorDto.advisor,
          _entityName: "ConventionFranceTravailAdvisor",
          conventionId,
        },
      ],
    );

    await notifyFranceTravailUserAdvisorOnConventionFullySigned.execute({
      convention: conventionDtoFromEvent,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
          recipients: [advisor.email],
          params: {
            conventionId,
            advisorFirstName: advisor.firstName,
            advisorLastName: advisor.lastName,
            // biome-ignore lint/style/noNonNullAssertion: testing purpose
            immersionAddress: conventionDtoFromEvent.immersionAddress!,
            beneficiaryFirstName:
              conventionDtoFromEvent.signatories.beneficiary.firstName,
            beneficiaryLastName:
              conventionDtoFromEvent.signatories.beneficiary.lastName,
            beneficiaryEmail:
              conventionDtoFromEvent.signatories.beneficiary.email,
            dateStart: conventionDtoFromEvent.dateStart,
            dateEnd: conventionDtoFromEvent.dateEnd,
            businessName: conventionDtoFromEvent.businessName,
            magicLink: fakeGenerateMagicLinkUrlFn({
              id: conventionDtoFromEvent.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: advisor.email,
              now: timeGateway.now(),
            }),
            agencyLogoUrl: agency.logoUrl ?? undefined,
          },
        },
      ],
    });
  });

  it("peConnected without advisor", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withAgencyId(agency.id)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .withBeneficiaryFirstName("John")
      .withBeneficiaryLastName("Doe")
      .withBeneficiaryEmail("john.doe@plop.fr")
      .withImmersionAddress("127 Avenue de la République 94800 Villejuif")
      .withDateStart("2022-07-06")
      .withDateEnd("2022-07-30")
      .withSchedule((interval) =>
        reasonableSchedule(interval, ["samedi", "dimanche"]),
      )
      .withBusinessName("Boulangerie Les Echarts")
      .build();

    uow.conventionRepository.setConventions([conventionDtoFromEvent]);
    uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
      [
        {
          advisor: undefined,
          peExternalId: userAdvisorDto.user.peExternalId,
          _entityName: "ConventionFranceTravailAdvisor",
          conventionId,
        },
      ],
    );

    await notifyFranceTravailUserAdvisorOnConventionFullySigned.execute({
      convention: conventionDtoFromEvent,
    });

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });
});
