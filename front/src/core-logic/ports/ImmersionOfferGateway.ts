import { RomeSearchResponseDto } from "src/shared/rome";

export interface ImmersionOfferGateway {
  searchProfession: (searchTerm: string) => Promise<RomeSearchResponseDto>;
}
