import {
  errors,
  type GetSiretRequestDto,
  type SiretEstablishmentDto,
} from "shared";
import type { SiretGateway } from "../ports/SiretGateway";

export const getSiretEstablishmentFromApi = async (
  { siret, includeClosedEstablishments }: GetSiretRequestDto,
  siretGateway: SiretGateway,
): Promise<SiretEstablishmentDto> => {
  const siretEstablishment = await siretGateway.getEstablishmentBySiret(
    siret,
    includeClosedEstablishments,
  );

  if (!siretEstablishment) throw errors.siretApi.notFound({ siret });

  return siretEstablishment;
};
