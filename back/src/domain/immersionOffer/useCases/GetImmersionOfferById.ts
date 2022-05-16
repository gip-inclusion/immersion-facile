import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { UseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import { zString } from "shared/src/zodUtils";

export class GetImmersionOfferById extends UseCase<
  string,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
  ) {
    super();
  }

  inputSchema = zString;

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
