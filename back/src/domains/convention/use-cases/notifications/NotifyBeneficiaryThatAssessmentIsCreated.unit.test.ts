import {
  type AssessmentDto,
  type AssessmentStatus,
  ConventionDtoBuilder,
  type ExtractFromExisting,
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
  getFormattedFirstnameAndLastname,
} from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyBeneficiaryThatAssessmentIsCreated,
  type NotifyBeneficiaryThatAssessmentIsCreated,
} from "./NotifyBeneficiaryThatAssessmentIsCreated";

const convention = new ConventionDtoBuilder().build();
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

describe("NotifyBeneficiaryThatAssessmentIsCreated", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: NotifyBeneficiaryThatAssessmentIsCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    usecase = makeNotifyBeneficiaryThatAssessmentIsCreated({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          new UuidV4Generator(),
          new CustomTimeGateway(),
        ),
        timeGateway,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
      },
    });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  describe("wrong paths", () => {
    it("Throw when no convention is found", async () => {
      await expectPromiseToFailWithError(
        usecase.execute({ assessment }),
        errors.convention.notFound({ conventionId: assessment.conventionId }),
      );

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });
  });

  describe("right paths", () => {
    it("Send an email to beneficiary", async () => {
      const today = timeGateway.now();
      uow.conventionRepository.setConventions([convention]);

      await usecase.execute({ assessment });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_CREATED_BENEFICIARY_NOTIFICATION",
            params: {
              internshipKind: convention.internshipKind,
              conventionId: convention.id,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              magicLink: fakeGenerateMagicLinkUrlFn({
                id: convention.id,
                email: convention.signatories.beneficiary.email,
                role: "beneficiary",
                targetRoute: frontRoutes.assessmentDocument,
                now: today,
                lifetime: "long",
              }),
            },
            recipients: [convention.signatories.beneficiary.email],
          },
        ],
      });
    });
  });
});
