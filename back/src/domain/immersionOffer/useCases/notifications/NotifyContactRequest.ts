import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "../../../../shared/contactEstablishment";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../../immersionApplication/ports/EmailGateway";
import { ImmersionOfferRepository } from "../../ports/ImmersionOfferRepository";

const logger = createLogger(__filename);

export class NotifyContactRequest extends UseCase<ContactEstablishmentRequestDto> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }
  inputSchema = contactEstablishmentRequestSchema;

  public async _execute(
    payload: ContactEstablishmentRequestDto,
  ): Promise<void> {
    const { immersionOfferId } = payload;

    const immersionOffer =
      await this.immersionOfferRepository.getImmersionOfferById(
        immersionOfferId,
      );
    if (!immersionOffer)
      throw new Error(`Not found: immersionOfferId=${immersionOfferId}`);

    const contact =
      await this.immersionOfferRepository.getContactByImmersionOfferId(
        immersionOfferId,
      );
    if (!contact)
      throw new Error(
        `Missing contact details: immersionOffer.id=${immersionOffer.id}`,
      );

    const establishment =
      await this.immersionOfferRepository.getEstablishmentByImmersionOfferId(
        immersionOfferId,
      );
    if (!establishment)
      throw new Error(
        `Missing establishment: immersionOffer.id=${immersionOffer.id}`,
      );
    if (establishment.contactMethod !== payload.contactMode) {
      throw new Error(
        `Contact mode mismatch: immersionOffer.id=${immersionOffer.id}, ` +
          `establishment.contactMethod=${establishment.contactMethod}, ` +
          `payload.contactMode=${payload.contactMode}`,
      );
    }

    switch (payload.contactMode) {
      case "EMAIL": {
        await this.withAllowedRecipient(contact.email, (recipient) =>
          this.emailGateway.sendContactByEmailRequest(recipient, {
            businessName: establishment.name,
            contactFirstName: contact.firstName,
            contactLastName: contact.lastName,
            jobLabel: "XXXX", // TODO: Populate with ROME label from immersionOffer.
            potentialBeneficiaryFirstName:
              payload.potentialBeneficiaryFirstName,
            potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
            potentialBeneficiaryEmail: payload.potentialBeneficiaryEmail,
            message: payload.message!,
          }),
        );
        break;
      }
      case "PHONE": {
        await this.withAllowedRecipient(
          payload.potentialBeneficiaryEmail,
          (recipient) =>
            this.emailGateway.sendContactByPhoneInstructions(recipient, {
              businessName: establishment.name,
              contactFirstName: contact.firstName,
              contactLastName: contact.lastName,
              contactPhone: contact.phone,
              potentialBeneficiaryFirstName:
                payload.potentialBeneficiaryFirstName,
              potentialBeneficiaryLastName:
                payload.potentialBeneficiaryLastName,
            }),
        );
        break;
      }
      case "IN_PERSON": {
        await this.withAllowedRecipient(
          payload.potentialBeneficiaryEmail,
          (recipient) =>
            this.emailGateway.sendContactInPersonInstructions(recipient, {
              businessName: establishment.name,
              contactFirstName: contact.firstName,
              contactLastName: contact.lastName,
              businessAddress: establishment.address,
              potentialBeneficiaryFirstName:
                payload.potentialBeneficiaryFirstName,
              potentialBeneficiaryLastName:
                payload.potentialBeneficiaryLastName,
            }),
        );
        break;
      }
    }
  }

  private async withAllowedRecipient<P>(
    recipient: string,
    sendFn: (recipient: string) => Promise<void>,
  ): Promise<void> {
    const [allowedRecipient] = this.emailFilter.filter([recipient], {
      onRejected: (email) => logger.info(`Skipped sending email to: ${email}`),
    });

    if (!allowedRecipient) {
      logger.info("No allowed recipients. Email sending skipped.");
      return;
    }

    return sendFn(allowedRecipient);
  }
}
