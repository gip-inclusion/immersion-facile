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

export class AddFormEstablishment
  implements UseCase<FormEstablishmentDto, AddFormEstablishmentResponseDto>
{
  constructor(
    private readonly immersionOfferRepository: FormEstablishmentRepository,
  ) {}

  public async execute(
    dto: FormEstablishmentDto,
  ): Promise<AddFormEstablishmentResponseDto> {
    logger.debug({ dto: dto }, "Execute AddImmersionOffer Use case, with DTO");

    formEstablishmentSchema.parse(dto);

    const id = await this.immersionOfferRepository.save(dto);

    if (!id) throw new ConflictError("empty");
    return id;
  }
}
