import {
  SearchImmersionResultDto,
  immersionOfferIdSchema,
  ImmersionOfferId,
} from "../../../shared/SearchImmersionDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";

export class GetImmersionOfferById extends UseCase<
  ImmersionOfferId,
  SearchImmersionResultDto
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = immersionOfferIdSchema;

  public async _execute(
    id: ImmersionOfferId,
  ): Promise<SearchImmersionResultDto> {
    const immersionOffer =
      await this.immersionOfferRepository.getImmersionFromUuid(id);
    if (!immersionOffer) throw new NotFoundError(id);
    return immersionOffer;
  }
}
