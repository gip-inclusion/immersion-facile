import {
  type AssessmentDto,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  type ShortLinkId,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyBeneficiaryThatAssessmentNeedsSignature,
  type NotifyBeneficiaryThatAssessmentNeedsSignature,
} from "./NotifyBeneficiaryThatAssessmentNeedsSignature";

const convention = new ConventionDtoBuilder().build();

const assessment: AssessmentDto = {
  conventionId: convention.id,
  status: "COMPLETED",
  endedWithAJob: false,
  establishmentFeedback: "Feedback",
  establishmentAdvices: "Advices",
  beneficiaryAgreement: true,
  beneficiaryFeedback: null,
  signedAt: null,
};

describe("NotifyBeneficiaryThatAssessmentNeedsSignature", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: NotifyBeneficiaryThatAssessmentNeedsSignature;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: TimeGateway;
  let shortLinkGenerator: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    shortLinkGenerator = new DeterministShortLinkIdGeneratorGateway();
    config = new AppConfigBuilder({}).build();
    usecase = makeNotifyBeneficiaryThatAssessmentNeedsSignature({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          new UuidV4Generator(),
          timeGateway,
        ),
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGeneratorGateway: shortLinkGenerator,
        config,
      },
    });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("throws when convention not found", async () => {
    await expectPromiseToFailWithError(
      usecase.execute({ convention, assessment }),
      errors.convention.notFound({ conventionId: convention.id }),
    );
    expectSavedNotificationsAndEvents({ emails: [] });
    expectToEqual(uow.shortLinkQuery.getShortLinks(), []);
  });

  it("throws when assessment not found", async () => {
    uow.conventionRepository.setConventions([convention]);
    uow.assessmentRepository.assessments = [];

    await expectPromiseToFailWithError(
      usecase.execute({ convention, assessment }),
      errors.assessment.notFound(convention.id),
    );
    expectSavedNotificationsAndEvents({ emails: [] });
    expectToEqual(uow.shortLinkQuery.getShortLinks(), []);
  });

  it("does not send notification when assessment status is DID_NOT_SHOW", async () => {
    const assessmentDidNotShow: AssessmentDto = {
      ...assessment,
      status: "DID_NOT_SHOW",
    };
    uow.conventionRepository.setConventions([convention]);
    uow.assessmentRepository.assessments = [
      {
        _entityName: "Assessment",
        ...assessmentDidNotShow,
        numberOfHoursActuallyMade: null,
      },
    ];

    await usecase.execute({ convention, assessment: assessmentDidNotShow });

    expectSavedNotificationsAndEvents({ emails: [] });
    expectToEqual(uow.shortLinkQuery.getShortLinks(), []);
  });

  it("notify beneficiary that assessment needs signature with single-use and 2-day lifetime signature short link", async () => {
    uow.conventionRepository.setConventions([convention]);
    uow.assessmentRepository.assessments = [
      {
        _entityName: "Assessment",
        ...assessment,
        numberOfHoursActuallyMade: null,
      },
    ];

    const shortLinkId: ShortLinkId = "signature-short-link-id";
    shortLinkGenerator.addMoreShortLinkIds([shortLinkId]);

    await usecase.execute({ convention, assessment });

    const expectedLongLink = fakeGenerateMagicLinkUrlFn({
      id: convention.id,
      role: convention.signatories.beneficiary.role,
      email: convention.signatories.beneficiary.email,
      now: timeGateway.now(),
      targetRoute: frontRoutes.assessmentDocument,
      lifetime: "2Days",
    });

    expectToEqual(uow.shortLinkQuery.getShortLinks(), [
      {
        id: shortLinkId,
        url: expectedLongLink,
        lastUsedAt: null,
      },
    ]);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_NEEDS_SIGNATURE_BENEFICIARY_NOTIFICATION",
          params: {
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            assessmentSignatureLink: makeShortLinkUrl(config, shortLinkId),
          },
          recipients: [convention.signatories.beneficiary.email],
        },
      ],
    });
  });
});
