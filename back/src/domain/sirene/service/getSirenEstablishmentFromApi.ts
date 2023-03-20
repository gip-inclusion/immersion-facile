import {
  EstablishmentFromSirenApiDto,
  GetSiretRequestDto,
  NafDto,
  NumberEmployeesRange,
  propEq,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { SirenApiRawEstablishment, SirenGateway } from "../ports/SirenGateway";

export const getSirenEstablishmentFromApi = async (
  { siret, includeClosedEstablishments }: GetSiretRequestDto,
  sirenGateway: SirenGateway,
): Promise<EstablishmentFromSirenApiDto> => {
  const response = await sirenGateway.getEstablishmentBySiret(
    siret,
    includeClosedEstablishments,
  );

  if (
    !response ||
    !response.etablissements ||
    response.etablissements.length < 1
  ) {
    throw new NotFoundError(
      `Did not find establishment with siret : ${siret} in siren API`,
    );
  }

  return convertSirenEstablishmentToResponse(response.etablissements[0]);
};

const convertSirenEstablishmentToResponse = (
  sirenEstablishment: SirenApiRawEstablishment,
): EstablishmentFromSirenApiDto => ({
  siret: sirenEstablishment.siret,
  businessName: getBusinessName(sirenEstablishment),
  businessAddress: getFormattedAddress(sirenEstablishment),
  nafDto: getNafAndNomenclature(sirenEstablishment),
  numberEmployeesRange: getNumberEmployeesRange(sirenEstablishment),
  isOpen: getIsActive(sirenEstablishment),
});

const getBusinessName = ({ uniteLegale }: SirenApiRawEstablishment): string => {
  const denomination = uniteLegale.denominationUniteLegale;
  if (denomination) return denomination;

  return [uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale]
    .filter((el) => !!el)
    .join(" ");
};

const getNafAndNomenclature = ({
  uniteLegale,
}: SirenApiRawEstablishment): NafDto | undefined => {
  const naf = uniteLegale.activitePrincipaleUniteLegale?.replace(".", "");
  if (!naf || !uniteLegale.nomenclatureActivitePrincipaleUniteLegale) return;

  return {
    code: naf,
    nomenclature: uniteLegale.nomenclatureActivitePrincipaleUniteLegale,
  };
};
const getFormattedAddress = ({
  adresseEtablissement,
}: SirenApiRawEstablishment): string =>
  [
    adresseEtablissement.numeroVoieEtablissement,
    adresseEtablissement.typeVoieEtablissement,
    adresseEtablissement.libelleVoieEtablissement,
    adresseEtablissement.codePostalEtablissement,
    adresseEtablissement.libelleCommuneEtablissement,
  ]
    .filter((el) => !!el)
    .join(" ");

const getIsActive = ({
  uniteLegale,
  periodesEtablissement,
}: SirenApiRawEstablishment) => {
  const lastPeriod = periodesEtablissement.find(propEq("dateFin", null));
  if (!lastPeriod) return false;

  return (
    uniteLegale.etatAdministratifUniteLegale === "A" &&
    lastPeriod.etatAdministratifEtablissement === "A"
  );
};

const getNumberEmployeesRange = ({
  uniteLegale,
}: SirenApiRawEstablishment): NumberEmployeesRange | undefined => {
  const tefenCode = uniteLegale.trancheEffectifsUniteLegale;
  if (!tefenCode) return;
  if (tefenCode === "NN") return "";
  return employeeRangeByTefenCode[<TefenCode>+tefenCode];
};

// prettier-ignore
// tefenCode is a French standard code for the number of employees in a company.
type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

const employeeRangeByTefenCode: Record<TefenCode, NumberEmployeesRange> = {
  [-1]: "",
  [0]: "0",
  [1]: "1-2",
  [2]: "3-5",
  [3]: "6-9",
  [11]: "10-19",
  [12]: "20-49",
  [21]: "50-99",
  [22]: "100-199",
  [31]: "200-249",
  [32]: "250-499",
  [41]: "500-999",
  [42]: "1000-1999",
  [51]: "2000-4999",
  [52]: "5000-9999",
  [53]: "+10000",
};
