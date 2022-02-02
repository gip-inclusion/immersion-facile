import { BadRequestError } from "../../adapters/primary/helpers/sendHttpResponse";
import { GetSiretUseCase } from "./useCases/GetSiret";

export const rejectsSiretIfNotAnOpenCompany = async (
  getSiret: GetSiretUseCase,
  siret: string,
) => {
  const siretLookupRes = await getSiret.execute({
    siret,
    includeClosedEstablishments: true,
  });

  if (!siretLookupRes.isOpen) {
    throw new BadRequestError(
      `Ce SIRET (${siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
    );
  }
};
