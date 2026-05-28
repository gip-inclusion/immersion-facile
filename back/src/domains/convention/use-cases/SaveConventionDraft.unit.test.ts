import { subDays } from "date-fns";
import {
  type ConventionDraftDto,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  type InternshipKind,
} from "shared";
import { v4 as uuid } from "uuid";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
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
  makeSaveConventionDraft,
  type SaveConventionDraft,
} from "./SaveConventionDraft";

describe("SaveConventionDraft", () => {
  const email = "fake-email@yahoo.com";
  const internshipKind: InternshipKind = "immersion";
  const messageContent = "message content";
  const shortLinkId = "shortLink1";
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: SaveConventionDraft;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
    usecase = makeSaveConventionDraft({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          uuidGenerator: new UuidV4Generator(),
          timeGateway,
        }),
        timeGateway,
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

    expectToEqual(uow.conventionDraftRepository.conventionDrafts, [
      {
        ...conventionDraft,
        updatedAt: timeGateway.now().toISOString(),
      },
    ]);

    expectObjectInArrayToMatch(uow.outboxRepository.events, [
      {
        topic: "ConventionDraftSaved",
        payload: {
          senderEmail: email,
          draftId: conventionDraft.id,
          details: null,
          recipientEmail: null,
        },
      },
    ]);
  });

  it("sends an email to the sender and the recipient with details", async () => {
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

    expectToEqual(uow.conventionDraftRepository.conventionDrafts, [
      {
        ...conventionDraft,
        updatedAt: timeGateway.now().toISOString(),
      },
    ]);

    expectObjectInArrayToMatch(uow.outboxRepository.events, [
      {
        topic: "ConventionDraftSaved",
        payload: {
          senderEmail: email,
          draftId: conventionDraft.id,
          details: messageContent,
          recipientEmail,
        },
      },
    ]);
  });

  it("updates an existing convention draft", async () => {
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind,
    };

    uow.conventionDraftRepository.conventionDrafts = [
      {
        ...conventionDraft,
        updatedAt: subDays(timeGateway.now(), 1).toISOString(),
      },
    ];

    await usecase.execute({
      conventionDraft,
      senderEmail: email,
      details: messageContent,
    });

    expectToEqual(uow.conventionDraftRepository.conventionDrafts, [
      {
        ...conventionDraft,
        updatedAt: timeGateway.now().toISOString(),
      },
    ]);

    expectObjectInArrayToMatch(uow.outboxRepository.events, [
      {
        topic: "ConventionDraftSaved",
        payload: {
          senderEmail: email,
          draftId: conventionDraft.id,
          details: messageContent,
          recipientEmail: null,
        },
      },
    ]);
  });

  it("throw a conflict error if the convention draft has been updated since the last save", async () => {
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind,
    };

    uow.conventionDraftRepository.conventionDrafts = [
      {
        ...conventionDraft,
        updatedAt: "2024-10-08T00:11:00.000Z",
      },
    ];

    await expectPromiseToFailWithError(
      usecase.execute({
        conventionDraft: {
          ...conventionDraft,
          updatedAt: "2024-10-08T00:00:00.000Z",
        },
        senderEmail: email,
      }),
      errors.conventionDraft.conflict({
        conventionDraftId: conventionDraft.id,
      }),
    );
  });
});
