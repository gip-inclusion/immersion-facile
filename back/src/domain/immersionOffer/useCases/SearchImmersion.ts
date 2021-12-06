import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { UseCase } from "../../core/UseCase";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";

export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    params: SearchImmersionRequestDto,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchParams = convertRequestDtoToSearchParams(params);
    await this.immersionOfferRepository.insertSearch(searchParams);
    const apiConsumerName = apiConsumer?.name;

    return this.immersionOfferRepository.getFromSearch(
      searchParams,
      apiConsumerName !== undefined,
    );
  }
}

const convertRequestDtoToSearchParams = ({
  rome,
  nafDivision,
  siret,
  location,
  distance_km,
}: SearchImmersionRequestDto): SearchParams => ({
  rome: rome,
  nafDivision,
  siret,
  lat: location.lat,
  lon: location.lon,
  distance_km,
});
