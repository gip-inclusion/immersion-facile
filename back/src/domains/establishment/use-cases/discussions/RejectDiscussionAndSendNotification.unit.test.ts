import {
  DiscussionBuilder,
  type DiscussionDto,
  type DiscussionStatus,
  InclusionConnectedUserBuilder,
  type RejectionKind,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
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
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type RejectDiscussionAndSendNotification,
  makeRejectDiscussionAndSendNotification,
} from "./RejectDiscussionAndSendNotification";

const unauthorizedUser = new InclusionConnectedUserBuilder()
  .withEmail("unauthorized@domain.com")
  .build();
const authorizedUser = new InclusionConnectedUserBuilder()
  .withEmail("authorized@domain.com")
  .build();
const discussion = new DiscussionBuilder()
  .withEstablishmentContact({
    email: authorizedUser.email,
  })
  .build();

const emailParams = {
  subject:
    "L’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion",
  htmlContent: `Bonjour, 
  
Malheureusement, nous ne souhaitons pas donner suite à votre candidature à l’immersion.

La raison du refus est : l’entreprise estime ne pas être en capacité de vous aider dans votre projet professionnel.

N’hésitez pas à <a href="https://immersion-facile.beta.gouv.fr/recherche">rechercher une immersion dans une autre entreprise</a> !

Bonne journée, 
estab lishment, représentant de l'entreprise My default business name`,
};

describe("RejectDiscussionAndSendNotification", () => {
  let rejectPotentialBeneficiaryOnDiscussion: RejectDiscussionAndSendNotification;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  beforeEach(() => {
    uow = createInMemoryUow();
    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new TestUuidGenerator();
    const uowPerformer = new InMemoryUowPerformer(uow);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    rejectPotentialBeneficiaryOnDiscussion =
      makeRejectDiscussionAndSendNotification({
        uowPerformer,
        deps: {
          replyDomain: "reply-domain",
          timeGateway,
          saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
            uuidGenerator,
            timeGateway,
          ),
        },
      });
  });

  it("throws NotFoundError if discussion is not found", async () => {
    await expectPromiseToFailWithError(
      rejectPotentialBeneficiaryOnDiscussion.execute(
        {
          discussionId: discussion.id,
          rejectionKind: "UNABLE_TO_HELP",
        },
        unauthorizedUser,
      ),
      errors.discussion.notFound({ discussionId: discussion.id }),
    );
  });

  it("throws ForbiddenError if user is not allowed to reject this discussion", async () => {
    await uow.discussionRepository.insert(discussion);

    await expectPromiseToFailWithError(
      rejectPotentialBeneficiaryOnDiscussion.execute(
        {
          discussionId: discussion.id,
          rejectionKind: "UNABLE_TO_HELP",
        },
        unauthorizedUser,
      ),
      errors.discussion.rejectForbidden({
        discussionId: discussion.id,
        userId: unauthorizedUser.id,
      }),
    );
  });

  it("throws BadRequestError if discussion is already rejected", async () => {
    const originalDiscussion: DiscussionDto = {
      ...discussion,
      status: "REJECTED",
      rejectionKind: "UNABLE_TO_HELP",
    };

    await uow.discussionRepository.insert(originalDiscussion);
    expectUpdatedDiscussionToBeRejected({
      status: "REJECTED",
      rejectionKind: "UNABLE_TO_HELP",
      updatedDiscussion: originalDiscussion,
    });

    const rerejectedDiscussion = {
      ...originalDiscussion,
    };

    await expectPromiseToFailWithError(
      rejectPotentialBeneficiaryOnDiscussion.execute(
        {
          discussionId: rerejectedDiscussion.id,
          rejectionKind: "UNABLE_TO_HELP",
        },
        authorizedUser,
      ),
      errors.discussion.alreadyRejected({
        discussionId: rerejectedDiscussion.id,
      }),
    );
  });

  it("rejects discussion with kind but no reason provided (rejectionKind !== OTHER)", async () => {
    await uow.discussionRepository.insert(discussion);

    await rejectPotentialBeneficiaryOnDiscussion.execute(
      {
        discussionId: discussion.id,
        rejectionKind: "UNABLE_TO_HELP",
      },
      authorizedUser,
    );

    const updatedDiscussion = await uow.discussionRepository.getById(
      discussion.id,
    );
    expectUpdatedDiscussionToBeRejected({
      status: "REJECTED",
      rejectionKind: "UNABLE_TO_HELP",
      updatedDiscussion,
    });

    expectToEqual(updatedDiscussion.exchanges, [
      ...discussion.exchanges,
      {
        subject: emailParams.subject,
        message: emailParams.htmlContent,
        attachments: [],
        sender: "establishment",
        recipient: "potentialBeneficiary",
        sentAt: new CustomTimeGateway().now().toISOString(),
      },
    ]);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "DISCUSSION_EXCHANGE",
          sender: immersionFacileNoReplyEmailSender,
          params: emailParams,
          recipients: [`${discussion.id}_b@reply-domain`],
          replyTo: {
            email: `${discussion.id}_e@reply-domain`,
            name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
          },
        },
      ],
    });
  });

  it("rejects discussion with kind and reason provided (rejectionKind === OTHER)", async () => {
    await uow.discussionRepository.insert(discussion);

    await rejectPotentialBeneficiaryOnDiscussion.execute(
      {
        discussionId: discussion.id,
        rejectionKind: "OTHER",
        rejectionReason: "my rejection reason",
      },
      authorizedUser,
    );

    const updatedDiscussion = await uow.discussionRepository.getById(
      discussion.id,
    );

    expectUpdatedDiscussionToBeRejected({
      status: "REJECTED",
      rejectionKind: "OTHER",
      rejectionReason: "my rejection reason",
      updatedDiscussion,
    });
  });
});

const expectUpdatedDiscussionToBeRejected = async ({
  status,
  rejectionKind,
  rejectionReason,
  updatedDiscussion,
}: {
  status: DiscussionStatus;
  rejectionKind: RejectionKind;
  rejectionReason?: string;
  updatedDiscussion: DiscussionDto;
}) => {
  if (updatedDiscussion.status !== "REJECTED")
    throw new Error("Expected discussion to be rejected");
  expect(updatedDiscussion.status).toBe(status);
  expect(updatedDiscussion.rejectionKind).toBe(rejectionKind);
  if (updatedDiscussion.rejectionKind !== "OTHER") return;
  expect(updatedDiscussion.rejectionReason).toBe(rejectionReason);
};
