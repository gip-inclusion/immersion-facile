import { BadRequestError } from "../../adapters/primary/helpers/httpErrors";
import { SiretGateway } from "./ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "./service/getSirenEstablishmentFromApi";

export const rejectsSiretIfNotAnOpenCompany = async (
  sirenGateway: SiretGateway,
  siret: string,
) => {
  const sirenEstablishment = await getSirenEstablishmentFromApi(
    { siret, includeClosedEstablishments: true },
    sirenGateway,
  );

  if (!sirenEstablishment.isOpen) {
    throw new BadRequestError(
      `Ce SIRET (${siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
    );
  }
};
