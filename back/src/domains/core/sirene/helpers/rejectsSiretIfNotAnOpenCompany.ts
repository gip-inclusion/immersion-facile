import { errors } from "shared";
import type { SiretGateway } from "../ports/SiretGateway";
import { getSiretEstablishmentFromApi } from "./getSirenEstablishmentFromApi";

export const rejectsSiretIfNotAnOpenCompany = async (
  siretGateway: SiretGateway,
  siret: string,
) => {
  const siretEstablishment = await getSiretEstablishmentFromApi(
    { siret, includeClosedEstablishments: true },
    siretGateway,
  );
  if (!siretEstablishment) throw errors.siretApi.notFound({ siret });

  if (!siretEstablishment.isOpen)
    throw errors.establishment.missingOrClosed({ siret });
};
