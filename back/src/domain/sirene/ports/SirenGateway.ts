import { SiretDto, SiretEstablishmentDto } from "shared";

export interface SiretGateway {
  getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SiretEstablishmentDto | undefined>;
}
