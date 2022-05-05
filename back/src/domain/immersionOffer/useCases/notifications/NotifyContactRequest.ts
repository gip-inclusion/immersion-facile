import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "shared/src/contactEstablishment";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../../immersionApplication/ports/EmailGateway";
import { EstablishmentAggregateRepository } from "../../ports/EstablishmentAggregateRepository";

const logger = createLogger(__filename);

export class NotifyContactRequest extends UseCase<ContactEstablishmentRequestDto> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }
  inputSchema = contactEstablishmentRequestSchema;

  public async _execute(
    payload: ContactEstablishmentRequestDto,
  ): Promise<void> {
    const { siret, romeLabel } = payload;

    const establishmentAggregate =
      await this.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate)
      throw new Error(`Missing establishment: siret=${siret}`);

    const contact = establishmentAggregate.contact;
    if (!contact) throw new Error(`Missing contact details for siret=${siret}`);

    if (contact.contactMethod !== payload.contactMode) {
      throw new Error(
        `Contact mode mismatch: ` +
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
              contact.copyEmails,
              {
                businessName: establishmentAggregate.establishment.name,
                contactFirstName: contact.firstName,
                contactLastName: contact.lastName,
                jobLabel: romeLabel,
                potentialBeneficiaryFirstName:
                  payload.potentialBeneficiaryFirstName,
                potentialBeneficiaryLastName:
                  payload.potentialBeneficiaryLastName,
                potentialBeneficiaryEmail: payload.potentialBeneficiaryEmail,
                message: payload.message,
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
                businessName: establishmentAggregate.establishment.name,
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
                businessName: establishmentAggregate.establishment.name,
                contactFirstName: contact.firstName,
                contactLastName: contact.lastName,
                businessAddress: establishmentAggregate.establishment.address,
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
