import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { SearchImmersionResultDto } from "../../../shared/searchImmersion/SearchImmersionResult.dto";
import { SiretAndRomeDto } from "../../../shared/siretAndRome/SiretAndRome.dto";
import { siretAndRomeSchema } from "../../../shared/siretAndRome/SiretAndRome.schema";
import { UseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

export class GetImmersionOfferBySiretAndRome extends UseCase<
  SiretAndRomeDto,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
  ) {
    super();
  }

  inputSchema = siretAndRomeSchema;

  public async _execute(
    siretAndRomeDto: SiretAndRomeDto,
  ): Promise<SearchImmersionResultDto> {
    const { siret, rome } = siretAndRomeDto;

    const searchImmersionResultDto =
      await this.establishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
        siret,
        rome,
      );

    if (!searchImmersionResultDto)
      throw new NotFoundError(
        `No offer found for siret ${siret} and rome ${rome}`,
      );
    return searchImmersionResultDto;
  }
}
