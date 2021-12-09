import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "../../../../shared/contactEstablishment";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../../immersionApplication/ports/EmailGateway";

export class NotifyEstablishmentOfContactRequest extends UseCase<ContactEstablishmentRequestDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }
  inputSchema = contactEstablishmentRequestSchema;

  public async _execute(
    payload: ContactEstablishmentRequestDto,
  ): Promise<void> {
    return; // TODO(nwettstein): Implement.
  }
}
