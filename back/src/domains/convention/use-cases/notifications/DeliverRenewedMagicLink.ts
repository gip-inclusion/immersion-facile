import {
  ConventionId,
  InternshipKind,
  conventionIdSchema,
  internshipKindSchema,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export type RenewMagicLinkPayload = {
  internshipKind: InternshipKind;
  emails: string[];
  magicLink: string;
  conventionStatusLink: string;
  conventionId?: ConventionId;
};

const renewMagicLinkPayloadSchema: z.Schema<RenewMagicLinkPayload> = z.object({
  internshipKind: internshipKindSchema,
  emails: z.array(z.string()),
  magicLink: z.string(),
  conventionStatusLink: z.string(),
  conventionId: conventionIdSchema.optional(),
});

export class DeliverRenewedMagicLink extends TransactionalUseCase<RenewMagicLinkPayload> {
  protected inputSchema = renewMagicLinkPayloadSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    { emails, magicLink, internshipKind, conventionId }: RenewMagicLinkPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "MAGIC_LINK_RENEWAL",
        recipients: emails,
        params: {
          internshipKind,
          magicLink,
          conventionId,
        },
      },
      followedIds: {
        conventionId,
      },
    });
  }
}
