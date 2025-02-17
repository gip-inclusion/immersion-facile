import {
  AgencyDtoBuilder,
  AssessmentDto,
  AssessmentStatus,
  ConventionDtoBuilder,
  ExtractFromExisting,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  reasonableSchedule,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
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
import { createAssessmentEntity } from "../../entities/AssessmentEntity";
import { NotifyAgencyThatAssessmentIsCreated } from "./NotifyAgencyThatAssessmentIsCreated";

const agency = new AgencyDtoBuilder().build();
const validator = new InclusionConnectedUserBuilder()
  .withEmail("validator@email.com")
  .withId("validator")
  .buildUser();
const convention = new ConventionDtoBuilder()
  .withAgencyId(agency.id)
  .withDateStart(new Date("2025-01-01").toISOString())
  .withDateEnd(new Date("2025-01-15").toISOString())
  .withSchedule(reasonableSchedule)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const assessment: Extract<
  AssessmentDto,
  {
    status: ExtractFromExisting<AssessmentStatus, "PARTIALLY_COMPLETED">;
  }
> = {
  endedWithAJob: false,
  conventionId: convention.id,
  status: "PARTIALLY_COMPLETED",
  lastDayOfPresence: new Date("2025-01-07").toISOString(),
  numberOfMissedHours: 4,
  establishmentFeedback: "osef",
  establishmentAdvices: "osef",
};

describe("NotifyAgencyThatAssessmentIsCreated", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: NotifyAgencyThatAssessmentIsCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;

  beforeEach(() => {
    uow = createInMemoryUow();
    config = new AppConfigBuilder().build();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    timeGateway = new CustomTimeGateway();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    usecase = new NotifyAgencyThatAssessmentIsCreated(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      config,
      shortLinkIdGeneratorGateway,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("Throw when no convention were found", async () => {
    await expectPromiseToFailWithError(
      usecase.execute({ assessment }),
      errors.convention.notFound({ conventionId: assessment.conventionId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Throw when no agency were found", async () => {
    await uow.conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      usecase.execute({ assessment }),
      errors.agency.notFound({ agencyId: convention.agencyId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Send an email to validators when beneficiary came", async () => {
    const shortLinkIds = ["shortlink1", "shortlink2"];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

    const validator2 = new InclusionConnectedUserBuilder()
      .withEmail("validator2@email.com")
      .withId("validator2")
      .buildUser();
    uow.userRepository.users = [validator, validator2];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);
    await uow.assessmentRepository.save(
      createAssessmentEntity(assessment, convention),
    );

    await usecase.execute({ assessment });

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
        id: convention.id,
        email: validator.email,
        now: timeGateway.now(),
        role: "validator",
        targetRoute: frontRoutes.assessmentDocument,
      }),
      [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
        id: convention.id,
        email: validator2.email,
        now: timeGateway.now(),
        role: "validator",
        targetRoute: frontRoutes.assessmentDocument,
      }),
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
          params: {
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            conventionDateEnd: convention.dateEnd,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
            assessment,
            numberOfHoursMade: "45h",
            magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
          },
          recipients: [validator.email],
        },
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
          params: {
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            conventionDateEnd: convention.dateEnd,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
            assessment,
            numberOfHoursMade: "45h",
            magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
          },
          recipients: [validator2.email],
          cc: [convention.signatories.beneficiary.email],
        },
      ],
    });
  });

  it("Send an email to validators when beneficiary did NOT came", async () => {
    const assessmentDidNotShow: AssessmentDto = {
      conventionId: convention.id,
      status: "DID_NOT_SHOW",
      endedWithAJob: false,
      establishmentFeedback: "osef feedback",
      establishmentAdvices: "osef conseil",
    };

    const validator2 = new InclusionConnectedUserBuilder()
      .withEmail("validator2@email.com")
      .withId("validator2")
      .buildUser();
    uow.userRepository.users = [validator, validator2];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);
    await uow.assessmentRepository.save(
      createAssessmentEntity(assessmentDidNotShow, convention),
    );

    await usecase.execute({ assessment: assessmentDidNotShow });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          params: {
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
          },
          recipients: [validator.email, validator2.email],
        },
      ],
    });
  });
});
