import { BadRequestError } from "../../adapters/primary/helpers/httpErrors";
import { SiretGateway } from "./ports/SirenGateway";
import { getSiretEstablishmentFromApi } from "./service/getSirenEstablishmentFromApi";

export const rejectsSiretIfNotAnOpenCompany = async (
  siretGateway: SiretGateway,
  siret: string,
) => {
  const siretEstablishment = await getSiretEstablishmentFromApi(
    { siret, includeClosedEstablishments: true },
    siretGateway,
  );

  if (!siretEstablishment.isOpen) {
    throw new BadRequestError(
      `Ce SIRET (${siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
    );
  }
};
