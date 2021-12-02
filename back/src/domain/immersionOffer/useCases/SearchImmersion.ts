import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { UseCase } from "../../core/UseCase";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";
import { convertEntityToSearchResultDto } from "./helpers";

export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResultDto[]
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    request: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]> {
    const searchParams = convertRequestDtoToSearchParams(request);
    await this.immersionOfferRepository.insertSearch(searchParams);
    const entities = await this.immersionOfferRepository.getFromSearch(
      searchParams,
    );
    return entities.map((e) =>
      convertEntityToSearchResultDto(e, request.location),
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
