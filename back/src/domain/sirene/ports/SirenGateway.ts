import { SirenEstablishmentDto, SiretDto } from "shared";

export interface SirenGateway {
  getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SirenEstablishmentDto | undefined>;
}
