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

    const annotatedImmersionOffer =
      await this.immersionOfferRepository.getAnnotatedImmersionOfferById(
        immersionOfferId,
      );
    if (!annotatedImmersionOffer)
      throw new Error(`Not found: immersionOfferId=${immersionOfferId}`);

    const contact =
      await this.immersionOfferRepository.getContactByImmersionOfferId(
        immersionOfferId,
      );
    if (!contact)
      throw new Error(
        `Missing contact details: immersionOffer.id=${annotatedImmersionOffer.id}`,
      );

    const annotatedEstablishment =
      await this.immersionOfferRepository.getAnnotatedEstablishmentByImmersionOfferId(
        immersionOfferId,
      );
    if (!annotatedEstablishment)
      throw new Error(
        `Missing establishment: immersionOffer.id=${annotatedImmersionOffer.id}`,
      );
    if (contact.contactMethod !== payload.contactMode) {
      throw new Error(
        `Contact mode mismatch: immersionOffer.id=${annotatedImmersionOffer.id}, ` +
          `establishment.contactMethod=${contact.contactMethod}, ` +
          `payload.contactMode=${payload.contactMode}`,
      );
    }

    switch (payload.contactMode) {
      case "EMAIL": {
        await this.emailFilter.withAllowedRecipients(
          [contact.email],
          ([establishmentContactEmail]) =>
            this.emailGateway.sendContactByEmailRequest(
              establishmentContactEmail,
              {
                businessName: annotatedEstablishment.name,
                contactFirstName: contact.firstName,
                contactLastName: contact.lastName,
                jobLabel: annotatedImmersionOffer.romeLabel,
                potentialBeneficiaryFirstName:
                  payload.potentialBeneficiaryFirstName,
                potentialBeneficiaryLastName:
                  payload.potentialBeneficiaryLastName,
                potentialBeneficiaryEmail: payload.potentialBeneficiaryEmail,
                message: payload.message!,
              },
            ),
          logger,
        );
        break;
      }
      case "PHONE": {
        await this.emailFilter.withAllowedRecipients(
          [payload.potentialBeneficiaryEmail],
          ([potentialBeneficiaryEmail]) =>
            this.emailGateway.sendContactByPhoneInstructions(
              potentialBeneficiaryEmail,
              {
                businessName: annotatedEstablishment.name,
                contactFirstName: contact.firstName,
                contactLastName: contact.lastName,
                contactPhone: contact.phone,
                potentialBeneficiaryFirstName:
                  payload.potentialBeneficiaryFirstName,
                potentialBeneficiaryLastName:
                  payload.potentialBeneficiaryLastName,
              },
            ),
          logger,
        );
        break;
      }
      case "IN_PERSON": {
        await this.emailFilter.withAllowedRecipients(
          [payload.potentialBeneficiaryEmail],
          ([potentialBeneficiaryEmail]) =>
            this.emailGateway.sendContactInPersonInstructions(
              potentialBeneficiaryEmail,
              {
                businessName: annotatedEstablishment.name,
                contactFirstName: contact.firstName,
                contactLastName: contact.lastName,
                businessAddress: annotatedEstablishment.address,
                potentialBeneficiaryFirstName:
                  payload.potentialBeneficiaryFirstName,
                potentialBeneficiaryLastName:
                  payload.potentialBeneficiaryLastName,
              },
            ),
          logger,
        );
        break;
      }
    }
  }
}
