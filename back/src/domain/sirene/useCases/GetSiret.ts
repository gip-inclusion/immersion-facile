import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { NafDto } from "../../../shared/naf";
import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
} from "../../../shared/siret";
import { UseCase } from "../../core/UseCase";
import { Establishment, SireneRepository } from "../ports/SireneRepository";
export class GetSiret extends UseCase<GetSiretRequestDto, GetSiretResponseDto> {
  constructor(private readonly sireneRepository: SireneRepository) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute({
    siret,
    includeClosedEstablishments = false,
  }: GetSiretRequestDto): Promise<GetSiretResponseDto> {
    const response = await this.sireneRepository.get(
      siret,
      includeClosedEstablishments,
    );
    if (!response || response.etablissements.length < 1) {
      throw new NotFoundError(siret);
    }
    return convertEtablissementToResponse(response.etablissements[0]);
  }
}

const getBusinessName = (etablissement: Establishment) => {
  const denomination = etablissement.uniteLegale.denominationUniteLegale;
  if (denomination) return denomination;

  return [
    etablissement.uniteLegale.prenomUsuelUniteLegale,
    etablissement.uniteLegale.nomUniteLegale,
  ]
    .filter((el) => !!el)
    .join(" ");
};

const getBusinessAddress = (etablissement: Establishment) =>
  [
    etablissement.adresseEtablissement.numeroVoieEtablissement,
    etablissement.adresseEtablissement.typeVoieEtablissement,
    etablissement.adresseEtablissement.libelleVoieEtablissement,
    etablissement.adresseEtablissement.codePostalEtablissement,
    etablissement.adresseEtablissement.libelleCommuneEtablissement,
  ]
    .filter((el) => !!el)
    .join(" ");

const getNaf = (etablissement: Establishment): NafDto | undefined => {
  if (
    !etablissement.uniteLegale.activitePrincipaleUniteLegale ||
    !etablissement.uniteLegale.nomenclatureActivitePrincipaleUniteLegale
  )
    return undefined;

  return {
    code: etablissement.uniteLegale.activitePrincipaleUniteLegale,
    nomenclature:
      etablissement.uniteLegale.nomenclatureActivitePrincipaleUniteLegale,
  };
};

const checkOpenForBusiness = (etablissement: Establishment): boolean => {
  // The etatAdministratifUniteLegale is "C" for closed establishments, "A" for active ones.
  return etablissement.uniteLegale.etatAdministratifUniteLegale === "A";
};

export const convertEtablissementToResponse = async (
  establishment: Establishment,
): Promise<GetSiretResponseDto> => ({
  siret: establishment.siret,
  businessName: getBusinessName(establishment),
  businessAddress: getBusinessAddress(establishment),
  naf: getNaf(establishment),
  isOpen: checkOpenForBusiness(establishment),
});
