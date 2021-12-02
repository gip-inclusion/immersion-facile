import {
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "src/shared/SearchImmersionDto";

export abstract class ImmersionSearchGateway {
  abstract search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]>;

  abstract addressLookup(query: string): Promise<Array<LocationSuggestionDto>>;
}
