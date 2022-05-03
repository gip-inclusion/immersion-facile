import { SiretDto, GetSiretResponseDto } from "src/shared/siret";

export interface SiretGatewayThroughBack {
  getSiretInfo: (siret: SiretDto) => Promise<GetSiretResponseDto>;
}
