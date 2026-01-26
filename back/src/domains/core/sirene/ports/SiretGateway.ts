import type { SiretDto, SiretEstablishmentDto } from "shared";

export type EstablishmentsFromSiretApi = Partial<
  Record<SiretDto, SiretEstablishmentDto>
>;

export interface SiretGateway {
  getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SiretEstablishmentDto | undefined>;
  getEstablishmentUpdatedBetween(
    fromDate: Date,
    toDate: Date,
    sirets: SiretDto[],
  ): Promise<EstablishmentsFromSiretApi>;
}
