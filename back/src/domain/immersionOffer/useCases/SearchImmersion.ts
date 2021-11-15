import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResponseDto,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { UseCase } from "../../core/UseCase";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";
import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";

export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResponseDto
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    request: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResponseDto> {
    const searchParams = convertRequestDtoToSearchParams(request);
    await this.immersionOfferRepository.insertSearch(searchParams);
    return this.immersionOfferRepository
      .getFromSearch(searchParams)
      .then((entities) => entities.map(convertEntityToSearchResultDto));
  }
}

const convertRequestDtoToSearchParams = ({
  rome,
  nafDivision,
  location,
  distance_km,
}: SearchImmersionRequestDto): SearchParams => ({
  rome: rome,
  nafDivision,
  lat: location.lat,
  lon: location.lon,
  distance: distance_km,
});

const convertEntityToSearchResultDto = (
  entity: ImmersionOfferEntity,
): SearchImmersionResultDto => {
  const props = entity.getProps();
  return {
    id: props.id,
    rome: props.rome,
    naf: props.naf,
    siret: props.siret,
    name: props.name,
    voluntary_to_immersion: props.voluntaryToImmersion,
    location: props.position,
    contact: props.contactInEstablishment
      ? {
          id: props.contactInEstablishment.id,
          first_name: props.contactInEstablishment.firstname,
          last_name: props.contactInEstablishment.name,
          email: props.contactInEstablishment.email,
          role: props.contactInEstablishment.role,
        }
      : undefined,
  };
};
