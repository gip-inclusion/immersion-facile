import {
  DiscussionBuilder,
  DiscussionDto,
  DiscussionStatus,
  InclusionConnectedUserBuilder,
  RejectionKind,
  expectPromiseToFailWithError,
  immersionFacileNoReplyEmailSender,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../../config/helpers/httpErrors";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  RejectDiscussionAndSendNotification,
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
      new NotFoundError(`No discussion found with id: ${discussion.id}`),
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
      new ForbiddenError(
        `User is not allowed to reject discussion ${discussion.id}`,
      ),
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
      new BadRequestError(
        `Can't reject discussion ${rerejectedDiscussion.id} because it is already rejected`,
      ),
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

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "DISCUSSION_EXCHANGE",
          sender: immersionFacileNoReplyEmailSender,
          params: {
            subject:
              "L’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion",
            htmlContent: `Bonjour,

Malheureusement, l’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion.
Nous proposons aux entreprises de vous envoyer cette réponse rapide afin que vous soyez fixé sur l’issue de cette candidature et que vous puissiez postuler ailleurs. 

La raison du refus est : l’entreprise estime ne pas être en capacité de vous aider dans votre projet professionnel.

N’hésitez pas à envoyer d’autre candidatures !

Bonne journée, L’équipe immersion Facilitée`,
          },
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
