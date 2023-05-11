import { GetSiretRequestDto, SiretEstablishmentDto } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { SiretGateway } from "../ports/SirenGateway";

export const getSiretEstablishmentFromApi = async (
  { siret, includeClosedEstablishments }: GetSiretRequestDto,
  siretGateway: SiretGateway,
): Promise<SiretEstablishmentDto> => {
  const siretEstablishment = await siretGateway.getEstablishmentBySiret(
    siret,
    includeClosedEstablishments,
  );

  if (!siretEstablishment) {
    throw new NotFoundError(
      `Did not find establishment with siret : ${siret} in siret API`,
    );
  }

  return siretEstablishment;
};
