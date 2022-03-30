import { ContactEstablishmentRequestDto } from "src/shared/contactEstablishment";
import { SearchImmersionRequestDto } from "src/shared/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "src/shared/searchImmersion/SearchImmersionResult.dto";

export interface ImmersionSearchGateway {
  search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]>;
  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void>;
}
