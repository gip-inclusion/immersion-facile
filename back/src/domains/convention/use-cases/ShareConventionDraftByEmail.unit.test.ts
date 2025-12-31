import {
  type ConventionDraftDto,
  expectToEqual,
  type InternshipKind,
} from "shared";
import { v4 as uuid } from "uuid";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import {
  makeSaveNotificationAndRelatedEvent,
  type SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { ShareConventionLinkByEmail } from "./ShareConventionDraftByEmail";

describe("ShareConventionLinkByEmail", () => {
  const email = "fake-email@yahoo.com";
  const internshipKind: InternshipKind = "immersion";
  const messageContent = "message content";
  const shortLinkId = "shortLink1";
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: ShareConventionLinkByEmail;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let timeGateway: TimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    const uuidGenerator = new UuidV4Generator();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

    usecase = new ShareConventionLinkByEmail(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      shortLinkIdGeneratorGateway,
      timeGateway,
      config,
    );
  });

  it("sends an email to the sender only", async () => {
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind,
    };
    await usecase.execute({
      conventionDraft,
      senderEmail: email,
    });

    expectToEqual(
      await uow.conventionDraftRepository.getById(conventionDraft.id),
      conventionDraft,
    );
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "SHARE_CONVENTION_DRAFT_SELF",
          recipients: [email],
          params: {
            internshipKind,
            conventionFormUrl: `${config.immersionFacileBaseUrl}/api/to/${shortLinkId}`,
          },
        },
      ],
    });
  });

  it("sends an email to the sender and the recipient", async () => {
    const recipientEmail = "recipient-email@test.com";
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind,
    };

    await usecase.execute({
      conventionDraft,
      senderEmail: email,
      recipientEmail,
      details: messageContent,
    });

    expectToEqual(
      await uow.conventionDraftRepository.getById(conventionDraft.id),
      conventionDraft,
    );
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "SHARE_CONVENTION_DRAFT_SELF",
          recipients: [email],
          params: {
            internshipKind,
            conventionFormUrl: `${config.immersionFacileBaseUrl}/api/to/${shortLinkId}`,
          },
        },
        {
          kind: "SHARE_CONVENTION_DRAFT_RECIPIENT",
          recipients: [recipientEmail],
          params: {
            internshipKind,
            conventionFormUrl: `${config.immersionFacileBaseUrl}/api/to/${shortLinkId}`,
            additionalDetails: messageContent,
          },
        },
      ],
    });
  });
});
