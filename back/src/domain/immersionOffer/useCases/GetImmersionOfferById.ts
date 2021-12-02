import {
  SearchImmersionResultDto,
  immersionOfferIdSchema,
  ImmersionOfferId,
} from "../../../shared/SearchImmersionDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { convertEntityToSearchResultDto } from "./helpers";
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
    // TODO: implement
    const immersionOffer =
      await this.immersionOfferRepository.getImmersionFromUuid(id);
    if (immersionOffer) {
      return convertEntityToSearchResultDto(immersionOffer);
    } else {
      throw new NotFoundError(id);
    }
  }
}
