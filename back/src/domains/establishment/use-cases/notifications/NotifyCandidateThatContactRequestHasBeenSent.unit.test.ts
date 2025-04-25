import {
  DiscussionBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type NotifyCandidateThatContactRequestHasBeenSent,
  makeNotifyCandidateThatContactRequestHasBeenSent,
} from "./NotifyCandidateThatContactRequestHasBeenSent";

describe("NotifyCandidateThatContactRequestHasBeenSent", () => {
  let notifyCandidateThatContactRequestHasBeenSent: NotifyCandidateThatContactRequestHasBeenSent;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    const uuidGenerator = new UuidV4Generator();
    const timeGateway = new CustomTimeGateway();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    notifyCandidateThatContactRequestHasBeenSent =
      makeNotifyCandidateThatContactRequestHasBeenSent({
        uowPerformer,
        deps: { saveNotificationAndRelatedEvent },
      });
  });

  it("throws when discussion is not found", async () => {
    const notFoundDiscussionId = "404";
    await expectPromiseToFailWithError(
      notifyCandidateThatContactRequestHasBeenSent.execute({
        siret: "11112222333344",
        discussionId: notFoundDiscussionId,
      }),
      errors.discussion.notFound({ discussionId: notFoundDiscussionId }),
    );
  });

  it("sends an email to the beneficiary when contact method is EMAIL", async () => {
    const discussion = new DiscussionBuilder()
      .withContactMethod("EMAIL")
      .build();

    uow.discussionRepository.discussions = [discussion];

    await notifyCandidateThatContactRequestHasBeenSent.execute({
      siret: discussion.siret,
      discussionId: discussion.id,
    });
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "CONTACT_BY_EMAIL_CANDIDATE_CONFIRMATION",
          recipients: [discussion.potentialBeneficiary.email],
          params: {
            businessName: discussion.businessName,
            beneficiaryFullName: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
          },
        },
      ],
    });
  });

  it.each(["PHONE", "IN_PERSON"] as const)(
    "does not sends an email when contact method is %s",
    async (contactMethod) => {
      const discussion = new DiscussionBuilder()
        .withContactMethod(contactMethod)
        .build();

      uow.discussionRepository.discussions = [discussion];

      await notifyCandidateThatContactRequestHasBeenSent.execute({
        discussionId: discussion.id,
        siret: discussion.siret,
      });

      expectSavedNotificationsAndEvents({ emails: [] });
    },
  );
});
