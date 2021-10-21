import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddImmersionOfferResponseDto,
  ImmersionOfferDto,
  immersionOfferSchema,
} from "../../../shared/ImmersionOfferDto";
import { createLogger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";

const logger = createLogger(__filename);

export class AddImmersionOffer
  implements UseCase<ImmersionOfferDto, AddImmersionOfferResponseDto>
{
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute(
    dto: ImmersionOfferDto,
  ): Promise<AddImmersionOfferResponseDto> {
    logger.debug({ dto: dto }, "Execute AddImmersionOffer Use case, with DTO");

    immersionOfferSchema.parse(dto);

    const id = await this.immersionOfferRepository.save(dto);

    if (!id) throw new ConflictError("empty");
    return id;
  }
}
