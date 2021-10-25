import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddFormEstablishmentResponseDto,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { createLogger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";

const logger = createLogger(__filename);

export class AddFormEstablishment extends UseCase<
  FormEstablishmentDto,
  AddFormEstablishmentResponseDto
> {
  constructor(
    private readonly immersionOfferRepository: FormEstablishmentRepository,
  ) {
    super();
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    dto: FormEstablishmentDto,
  ): Promise<AddFormEstablishmentResponseDto> {
    const id = await this.immersionOfferRepository.save(dto);
    if (!id) throw new ConflictError("empty");
    return id;
  }
}
