import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { ImmersionOfferId } from "shared/src/ImmersionOfferId";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { immersionOfferIdSchema } from "shared/src/searchImmersion/SearchImmersionResult.schema";
import { UseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

export class GetImmersionOfferById extends UseCase<
  ImmersionOfferId,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
  ) {
    super();
  }

  inputSchema = immersionOfferIdSchema;

  public async _execute(
    immersionOfferId: string,
    apiConsumer?: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const [siret, romeCode] = immersionOfferId.split("-");
    const searchImmersionResultDto =
      await this.establishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
        siret,
        romeCode,
      );
    if (!searchImmersionResultDto) throw new NotFoundError(immersionOfferId);

    return {
      ...searchImmersionResultDto,
      contactDetails: apiConsumer
        ? searchImmersionResultDto.contactDetails
        : undefined,
    };
  }
}
