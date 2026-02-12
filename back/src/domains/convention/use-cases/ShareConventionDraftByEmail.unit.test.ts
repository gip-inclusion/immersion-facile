import {
  type ConventionDraftDto,
  errors,
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
import {
  makeShareConventionDraftByEmail,
  type ShareConventionDraftByEmail,
} from "./ShareConventionDraftByEmail";

describe("ShareConventionDraftByEmail", () => {
  const email = "fake-email@yahoo.com";
  const internshipKind: InternshipKind = "immersion";
  const messageContent = "message content";
  const shortLinkId = "shortLink1";
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: ShareConventionDraftByEmail;
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

    usecase = makeShareConventionDraftByEmail({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent,
        shortLinkIdGeneratorGateway,
        timeGateway,
        config,
      },
    });
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
      {
        ...conventionDraft,
        updatedAt: timeGateway.now().toISOString(),
      },
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
      {
        ...conventionDraft,
        updatedAt: timeGateway.now().toISOString(),
      },
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

  it("updates an existing convention draft", async () => {
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind,
    };
    await uow.conventionDraftRepository.save(
      conventionDraft,
      "2024-10-08T00:00:00.000Z",
    );

    await uow.conventionDraftRepository.save(
      conventionDraft,
      "2024-10-08T00:11:00.000Z",
    );

    expectToEqual(
      await uow.conventionDraftRepository.getById(conventionDraft.id),
      {
        ...conventionDraft,
        updatedAt: "2024-10-08T00:11:00.000Z",
      },
    );
  });

  it("throw a conflict error if the convention draft has been updated since the last save", async () => {
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind,
    };
    await uow.conventionDraftRepository.save(
      conventionDraft,
      "2024-10-08T00:11:00.000Z",
    );

    await expect(
      usecase.execute({
        conventionDraft: {
          ...conventionDraft,
          updatedAt: "2024-10-08T00:00:00.000Z",
        },
        senderEmail: email,
      }),
    ).rejects.toThrow(
      errors.conventionDraft.conflict({
        conventionDraftId: conventionDraft.id,
      }),
    );
  });
});
