import { ContactEstablishmentRequestDto } from "src/shared/contactEstablishment";
import {
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "src/shared/SearchImmersionDto";

export interface ImmersionSearchGateway {
  search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]>;

  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void>;
}
