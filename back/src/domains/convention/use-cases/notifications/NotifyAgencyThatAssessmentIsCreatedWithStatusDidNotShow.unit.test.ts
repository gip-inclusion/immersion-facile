import {
  AgencyDtoBuilder,
  type AssessmentDto,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  getFormattedFirstnameAndLastname,
  reasonableSchedule,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyAgencyThatAssessmentIsCreatedWithStatusDidNotShow,
  type NotifyAgencyThatAssessmentIsCreatedWithStatusDidNotShow,
} from "./NotifyAgencyThatAssessmentIsCreatedWithStatusDidNotShow";

const agency = new AgencyDtoBuilder().build();
const validator = new ConnectedUserBuilder()
  .withEmail("validator@email.com")
  .withId("validator")
  .buildUser();
const convention = new ConventionDtoBuilder()
  .withAgencyId(agency.id)
  .withDateStart(new Date("2025-01-01").toISOString())
  .withDateEnd(new Date("2025-01-03").toISOString())
  .withSchedule(reasonableSchedule)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const assessmentDidNotShow: AssessmentDto = {
  conventionId: convention.id,
  status: "DID_NOT_SHOW",
  endedWithAJob: false,
  establishmentFeedback: "feedback",
  establishmentAdvices: "conseil",
  beneficiaryAgreement: true,
  beneficiaryFeedback: "my super feedback",
  signedAt: new Date("2025-01-01").toISOString(),
  createdAt: new Date("2025-01-01").toISOString(),
};

describe("NotifyAgencyThatAssessmentIsCreatedWithStatusDidNotShow", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: NotifyAgencyThatAssessmentIsCreatedWithStatusDidNotShow;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();

    timeGateway = new CustomTimeGateway();
    usecase = makeNotifyAgencyThatAssessmentIsCreatedWithStatusDidNotShow({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          new UuidV4Generator(),
          timeGateway,
        ),
      },
    });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("Throw when no convention were found", async () => {
    await expectPromiseToFailWithError(
      usecase.execute({ assessment: assessmentDidNotShow }),
      errors.convention.notFound({
        conventionId: assessmentDidNotShow.conventionId,
      }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Throw when no agency were found", async () => {
    await uow.conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      usecase.execute({ assessment: assessmentDidNotShow }),
      errors.agency.notFound({ agencyId: convention.agencyId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Send an email to validators when assessment status is DID_NOT_SHOW", async () => {
    const validator2 = new ConnectedUserBuilder()
      .withEmail("validator2@email.com")
      .withId("validator2")
      .buildUser();
    uow.userRepository.users = [validator, validator2];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: {
          isNotifiedByEmail: true,
          roles: ["validator", "counsellor"],
        },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);

    await usecase.execute({ assessment: assessmentDidNotShow });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
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

  it("Do not send an email when assessment status is not DID_NOT_SHOW", async () => {
    uow.userRepository.users = [validator];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);

    await usecase.execute({
      assessment: {
        ...assessmentDidNotShow,
        status: "COMPLETED",
      },
    });

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  describe("When the convention is FT connected", () => {
    const advisorEmail = "john.doe@mail.fr";

    beforeEach(() => {
      uow.conventionFranceTravailAdvisorRepository.ftConnectedUsers = {
        "pe-external-id": {
          advisor: {
            firstName: "John",
            lastName: "Doe",
            type: "PLACEMENT",
            email: advisorEmail,
          },
          user: {
            peExternalId: "pe-external-id",
            email: "elsa@email.com",
            firstName: "Elsa",
            lastName: "Oldenburg",
            birthdate: "1990-01-01",
            isJobseeker: false,
          },
        },
      };
      uow.conventionFranceTravailAdvisorRepository.conventionFranceTravailUsers =
        {
          [convention.id]: "pe-external-id",
        };
    });

    it("Send an email to the advisor (and not to other agency users)", async () => {
      uow.userRepository.users = [validator];
      await uow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );
      await uow.conventionRepository.save(convention);

      await usecase.execute({ assessment: assessmentDidNotShow });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              immersionObjective: convention.immersionObjective,
              conventionId: convention.id,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              businessName: convention.businessName,
              internshipKind: convention.internshipKind,
              immersionAppellationLabel:
                convention.immersionAppellation.appellationLabel,
            },
            recipients: [advisorEmail],
          },
        ],
      });
    });
  });
});
