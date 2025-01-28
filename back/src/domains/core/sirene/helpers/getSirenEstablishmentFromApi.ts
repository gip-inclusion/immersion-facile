import { GetSiretRequestDto, SiretEstablishmentDto, errors } from "shared";
import { SiretGateway } from "../ports/SiretGateway";

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
