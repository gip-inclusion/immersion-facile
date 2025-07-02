import { ascend, prop, sort } from "ramda";
import {
  addressDtoToString,
  type ContactEstablishmentEventPayload,
  contactEstablishmentEventPayloadSchema,
  createOpaqueEmail,
  type Email,
  errors,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  type TemplatedEmail,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { makeContactByEmailRequestParams } from "../../helpers/contactRequest";

export class NotifyContactRequest extends TransactionalUseCase<ContactEstablishmentEventPayload> {
  protected inputSchema = contactEstablishmentEventPayloadSchema;

  readonly #replyDomain: string;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #immersionFacileBaseUrl: AppConfig["immersionFacileBaseUrl"];

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
    immersionFacileBaseUrl: AppConfig["immersionFacileBaseUrl"],
  ) {
    super(uowPerformer);
    this.#replyDomain = `reply.${domain}`;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    payload: ContactEstablishmentEventPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const discussion = await uow.discussionRepository.getById(
      payload.discussionId,
    );
    if (!discussion)
      throw errors.discussion.notFound({ discussionId: payload.discussionId });

    const followedIds = {
      establishmentSiret: discussion.siret,
    };

    if (discussion.contactMode !== "EMAIL") {
      const recipients = [discussion.potentialBeneficiary.email];
      const params = {
        businessName: discussion.businessName,
        contactFirstName: discussion.establishmentContact.firstName,
        contactLastName: discussion.establishmentContact.lastName,
        kind: discussion.kind,
        potentialBeneficiaryFirstName:
          discussion.potentialBeneficiary.firstName,
        potentialBeneficiaryLastName: discussion.potentialBeneficiary.lastName,
      };

      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent:
          discussion.contactMode === "IN_PERSON"
            ? {
                sender: immersionFacileNoReplyEmailSender,
                recipients,
                kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
                params: {
                  ...params,
                  businessAddress: addressDtoToString(discussion.address),
                },
              }
            : {
                sender: immersionFacileNoReplyEmailSender,
                recipients,
                kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
                params: {
                  ...params,
                  contactPhone: discussion.establishmentContact.phone,
                },
              },
        followedIds,
      });

      return;
    }

    const appellationAndRomeDtos =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        [discussion.appellationCode],
      );
    const appellationLabel = appellationAndRomeDtos[0]?.appellationLabel;

    if (!appellationLabel)
      throw errors.discussion.missingAppellationLabel({
        appellationCode: discussion.appellationCode,
      });

    const opaqueEmail: Email = createOpaqueEmail({
      discussionId: payload.discussionId,
      recipient: {
        kind: "potentialBeneficiary",
        firstname: discussion.potentialBeneficiary.firstName,
        lastname: discussion.potentialBeneficiary.lastName,
      },
      replyDomain: this.#replyDomain,
    });

    const templatedContent: TemplatedEmail = {
      sender: immersionFacileNoReplyEmailSender,
      recipients: [discussion.establishmentContact.email],
      replyTo: {
        email: opaqueEmail,
        name: `${getFormattedFirstnameAndLastname({ firstname: discussion.potentialBeneficiary.firstName, lastname: discussion.potentialBeneficiary.lastName })} - via Immersion Facilitée`,
      },
      cc: discussion.establishmentContact.copyEmails.filter(
        (email) => email !== discussion.establishmentContact.email,
      ),
      kind: "CONTACT_BY_EMAIL_REQUEST",
      params: {
        ...(await makeContactByEmailRequestParams({
          uow,
          discussion,
          immersionFacileBaseUrl: this.#immersionFacileBaseUrl,
        })),
        replyToEmail: opaqueEmail,
      },
    };

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: payload.isLegacy
        ? {
            ...templatedContent,
            kind: "CONTACT_BY_EMAIL_REQUEST_LEGACY",
            params: {
              ...templatedContent.params,
              message: sort(ascend(prop("sentAt")), discussion.exchanges)[0]
                .message,
            },
          }
        : templatedContent,
      followedIds,
    });
  }
}
