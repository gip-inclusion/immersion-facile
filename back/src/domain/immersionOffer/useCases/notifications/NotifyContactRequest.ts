import {
  addressDtoToString,
  ContactEstablishmentEventPayload,
  contactEstablishmentEventPayloadSchema,
} from "shared";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { createOpaqueEmail } from "../../entities/DiscussionAggregate";

export class NotifyContactRequest extends TransactionalUseCase<ContactEstablishmentEventPayload> {
  private readonly replyDomain: string;
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
  ) {
    super(uowPerformer);
    this.replyDomain = `reply.${domain}`;
  }

  inputSchema = contactEstablishmentEventPayloadSchema;

  public async _execute(
    payload: ContactEstablishmentEventPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const discussion = await uow.discussionAggregateRepository.getById(
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

    switch (establishmentContact.contactMode) {
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

        await this.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "CONTACT_BY_EMAIL_REQUEST",
            recipients: [establishmentContact.email],
            replyTo: {
              email: createOpaqueEmail(
                payload.discussionId,
                "potentialBeneficiary",
                this.replyDomain,
              ),
              name: `${potentialBeneficiary.firstName} ${potentialBeneficiary.lastName} - via Immersion Facilitée`,
            },
            cc,
            params: {
              businessName: discussion.businessName,
              contactFirstName: establishmentContact.firstName,
              contactLastName: establishmentContact.lastName,
              appellationLabel,
              potentialBeneficiaryFirstName: potentialBeneficiary.firstName,
              potentialBeneficiaryLastName: potentialBeneficiary.lastName,
              immersionObjective: discussion.immersionObjective,
              potentialBeneficiaryPhone: potentialBeneficiary.phone,
              potentialBeneficiaryResumeLink: potentialBeneficiary.resumeLink,
              message: payload.message,
              businessAddress: addressDtoToString(discussion.address),
            },
          },
          followedIds,
        });

        break;
      }
      case "PHONE": {
        await this.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
            recipients: [potentialBeneficiary.email],
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
        await this.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
            recipients: [potentialBeneficiary.email],
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
