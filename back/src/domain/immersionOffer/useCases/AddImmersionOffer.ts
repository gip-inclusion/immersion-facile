import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddImmersionOfferResponseDto,
  ImmersionOfferDto,
  immersionOfferSchema,
} from "../../../shared/ImmersionOfferDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class AddImmersionOffer
  implements UseCase<ImmersionOfferDto, AddImmersionOfferResponseDto>
{
  private readonly logger = logger.child({ logsource: "AddImmersionOffer" });

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
