import { errors } from "shared";
import { SiretGateway } from "../ports/SiretGateway";
import { getSiretEstablishmentFromApi } from "./getSirenEstablishmentFromApi";

export const rejectsSiretIfNotAnOpenCompany = async (
  siretGateway: SiretGateway,
  siret: string,
) => {
  const siretEstablishment = await getSiretEstablishmentFromApi(
    { siret, includeClosedEstablishments: true },
    siretGateway,
  );

  if (!siretEstablishment.isOpen)
    throw errors.establishment.missingOrClosed({ siret });
};
