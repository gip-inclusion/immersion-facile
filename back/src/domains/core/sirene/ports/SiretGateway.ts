import { SiretDto, SiretEstablishmentDto } from "shared";

export interface SiretGateway {
  getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SiretEstablishmentDto | undefined>;
  getEstablishmentUpdatedBetween(
    fromDate: Date,
    toDate: Date,
    sirets: SiretDto[],
  ): Promise<Partial<Record<SiretDto, SiretEstablishmentDto>>>;
}
