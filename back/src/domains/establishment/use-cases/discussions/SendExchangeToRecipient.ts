import {
  createOpaqueEmail,
  type EmailAttachment,
  type Exchange,
  errors,
  immersionFacileNoReplyEmailSender,
  type WithDiscussionId,
  withDiscussionSchemaId,
} from "shared";
import { z } from "zod";
import {
  triggeredBySchema,
  type WithTriggeredBy,
} from "../../../core/events/events";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { NotificationGateway } from "../../../core/notifications/ports/NotificationGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

type SendExchangeToRecipientParams = WithDiscussionId &
  Partial<WithTriggeredBy> & {
    skipSendingEmail?: boolean;
  };

export class SendExchangeToRecipient extends TransactionalUseCase<SendExchangeToRecipientParams> {
  protected inputSchema = withDiscussionSchemaId.and(
    z.object({
      triggeredBy: triggeredBySchema.optional(),
      skipSendingEmail: z.boolean().optional(),
    }),
  );

  readonly #replyDomain: string;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #notificationGateway: NotificationGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
    notificationGateway: NotificationGateway,
  ) {
    super(uowPerformer);
    this.#replyDomain = `reply.${domain}`;

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#notificationGateway = notificationGateway;
  }

  protected async _execute(
    {
      discussionId,
      triggeredBy,
      skipSendingEmail,
    }: SendExchangeToRecipientParams,
    uow: UnitOfWork,
  ): Promise<void> {
    if (skipSendingEmail) return;
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });

    const lastExchange = discussion.exchanges.reduce<Exchange | undefined>(
      (acc, current) => (acc && acc.sentAt >= current.sentAt ? acc : current),
      undefined,
    );

    if (!lastExchange)
      throw new Error(`No exchanges on discussion '${discussion.id}'.`);

    const appellation = (
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        [discussion.appellationCode],
      )
    ).at(0);

    if (!appellation)
      throw errors.discussion.missingAppellationLabel({
        appellationCode: discussion.appellationCode,
      });

    const attachments = (
      await Promise.all(
        lastExchange.attachments.map(async ({ name, link }) => ({
          name,
          content: await this.#notificationGateway.getAttachmentContent(link),
        })),
      )
    ).filter(
      (emailAttachment) => emailAttachment.content !== null,
    ) as EmailAttachment[];

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "DISCUSSION_EXCHANGE",
        sender: immersionFacileNoReplyEmailSender,
        params: {
          subject: lastExchange.subject,
          htmlContent: `<div style="color: #b5b5b5; font-size: 12px">Pour rappel, voici les informations liées à cette mise en relation :
                  <br /><ul>
                  <li>Candidat : ${discussion.potentialBeneficiary.firstName} ${
                    discussion.potentialBeneficiary.lastName
                  }</li>
                  <li>Métier : ${appellation?.appellationLabel}</li>
                  <li>Entreprise : ${discussion.businessName} - ${
                    discussion.address.streetNumberAndAddress
                  } ${discussion.address.postcode} ${discussion.address.city}</li>
                  </ul><br /></div>
            ${
              lastExchange.message.length
                ? lastExchange.message
                : "--- pas de message ---"
            }`,
        },
        recipients: [
          lastExchange.recipient === "establishment"
            ? discussion.establishmentContact.email
            : discussion.potentialBeneficiary.email,
        ],
        cc:
          lastExchange.recipient === "establishment"
            ? discussion.establishmentContact.copyEmails
            : [],
        replyTo: {
          email: createOpaqueEmail({
            discussionId: discussion.id,
            recipient: {
              kind: lastExchange.sender,
              firstname:
                lastExchange.sender === "establishment"
                  ? discussion.establishmentContact.firstName
                  : discussion.potentialBeneficiary.firstName,
              lastname:
                lastExchange.sender === "establishment"
                  ? discussion.establishmentContact.lastName
                  : discussion.potentialBeneficiary.lastName,
            },
            replyDomain: this.#replyDomain,
          }),
          name:
            lastExchange.sender === "establishment"
              ? `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`
              : `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
        },
        attachments,
      },
      followedIds: {
        ...(triggeredBy?.kind === "connected-user"
          ? { userId: triggeredBy.userId }
          : undefined),
        establishmentSiret: discussion.siret,
      },
    });
  }
}
