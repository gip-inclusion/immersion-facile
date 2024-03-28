import { ascend, prop, sort } from "ramda";
import {
  ContactEstablishmentEventPayload,
  addressDtoToString,
  contactEstablishmentEventPayloadSchema,
  createOpaqueEmail,
  immersionFacileNoReplyEmailSender,
} from "shared";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyContactRequest extends TransactionalUseCase<ContactEstablishmentEventPayload> {
  protected inputSchema = contactEstablishmentEventPayloadSchema;

  readonly #replyDomain: string;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
  ) {
    super(uowPerformer);
    this.#replyDomain = `reply.${domain}`;

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
      throw new NotFoundError(
        `No discussion found with id: ${payload.discussionId}`,
      );

    const followedIds = {
      establishmentSiret: discussion.siret,
    };

    const { establishmentContact, potentialBeneficiary } = discussion;

    switch (establishmentContact.contactMethod) {
      case "EMAIL": {
        const appellationAndRomeDtos =
          await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes(
            [discussion.appellationCode],
          );
        const appellationLabel = appellationAndRomeDtos[0]?.appellationLabel;

        if (!appellationLabel)
          throw new BadRequestError(
            `No appellationLabel found for appellationCode: ${discussion.appellationCode}`,
          );
        const cc = establishmentContact.copyEmails.filter(
          (email) => email !== establishmentContact.email,
        );

        const opaqueEmail = createOpaqueEmail(
          payload.discussionId,
          "potentialBeneficiary",
          this.#replyDomain,
        );

        await this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "CONTACT_BY_EMAIL_REQUEST",
            recipients: [establishmentContact.email],
            sender: immersionFacileNoReplyEmailSender,
            replyTo: {
              email: opaqueEmail,
              name: `${potentialBeneficiary.firstName} ${potentialBeneficiary.lastName} - via Immersion Facilitée`,
            },
            cc,
            params: {
              replyToEmail: opaqueEmail,
              businessName: discussion.businessName,
              contactFirstName: establishmentContact.firstName,
              contactLastName: establishmentContact.lastName,
              appellationLabel,
              potentialBeneficiaryFirstName: potentialBeneficiary.firstName,
              potentialBeneficiaryLastName: potentialBeneficiary.lastName,
              immersionObjective: discussion.immersionObjective,
              potentialBeneficiaryPhone:
                potentialBeneficiary.phone ?? "pas de téléphone fourni",
              potentialBeneficiaryResumeLink: potentialBeneficiary.resumeLink,
              message: sort(ascend(prop("sentAt")), discussion.exchanges)[0]
                .message,
              businessAddress: addressDtoToString(discussion.address),
            },
          },
          followedIds,
        });

        break;
      }
      case "PHONE": {
        await this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
            recipients: [potentialBeneficiary.email],
            sender: immersionFacileNoReplyEmailSender,
            params: {
              businessName: discussion.businessName,
              contactFirstName: establishmentContact.firstName,
              contactLastName: establishmentContact.lastName,
              contactPhone: establishmentContact.phone,
              potentialBeneficiaryFirstName: potentialBeneficiary.firstName,
              potentialBeneficiaryLastName: potentialBeneficiary.lastName,
            },
          },
          followedIds,
        });
        break;
      }
      case "IN_PERSON": {
        await this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
            recipients: [potentialBeneficiary.email],
            sender: immersionFacileNoReplyEmailSender,
            params: {
              businessName: discussion.businessName,
              contactFirstName: establishmentContact.firstName,
              contactLastName: establishmentContact.lastName,
              businessAddress: addressDtoToString(discussion.address),
              potentialBeneficiaryFirstName: potentialBeneficiary.firstName,
              potentialBeneficiaryLastName: potentialBeneficiary.lastName,
            },
          },
          followedIds,
        });
        break;
      }
    }
  }
}
