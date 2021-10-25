import {
  SearchImmersionRequestDto,
  SearchImmersionResponseDto,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { UseCase } from "../../core/UseCase";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";
import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";

export class SearchImmersion
  implements UseCase<SearchImmersionRequestDto, SearchImmersionResponseDto>
{
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute(
    request: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResponseDto> {
    const searchParams = convertRequestDtoToSearchParams(request);
    this.immersionOfferRepository.insertSearch(searchParams);
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
    voluntary_to_immersion: props.voluntary_to_immersion,
    location: props.position,
    contact: props.contact_in_establishment
      ? {
          id: props.contact_in_establishment.id,
          first_name: props.contact_in_establishment.firstname,
          last_name: props.contact_in_establishment.name,
          email: props.contact_in_establishment.email,
          role: props.contact_in_establishment.role,
        }
      : undefined,
  };
};
