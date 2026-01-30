import type { GetSiretRequestDto, SiretEstablishmentDto } from "shared";
import type { SiretGateway } from "../ports/SiretGateway";

export const getSiretEstablishmentFromApi = async (
  { siret, includeClosedEstablishments }: GetSiretRequestDto,
  siretGateway: SiretGateway,
): Promise<SiretEstablishmentDto | null> => {
  const siretEstablishment = await siretGateway.getEstablishmentBySiret(
    siret,
    includeClosedEstablishments,
  );

  return siretEstablishment ?? null;
};
