import {
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResponseDto,
} from "src/shared/SearchImmersionDto";

export abstract class ImmersionSearchGateway {
  abstract search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResponseDto>;

  abstract addressLookup(query: string): Promise<Array<LocationSuggestionDto>>;
}
