import {
  SearchImmersionResultDto,
  immersionOfferIdSchema,
  ImmersionOfferId,
} from "../../../shared/SearchImmersionDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";

export class GetImmersionOfferById extends UseCase<
  ImmersionOfferId,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = immersionOfferIdSchema;

  public async _execute(
    id: ImmersionOfferId,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const withContactDetails = !!apiConsumer;
    const immersionOffer =
      await this.immersionOfferRepository.getImmersionFromUuid(
        id,
        withContactDetails,
      );
    if (!immersionOffer) throw new NotFoundError(id);
    return immersionOffer;
  }
}
