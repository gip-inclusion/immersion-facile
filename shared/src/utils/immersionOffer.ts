import { DepartmentCode } from "../address/address.dto";
import { fromNafSubClassToNafClass, NafDto } from "../naf";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const makeAppellationInformationUrl = (
  appellationCode: AppellationCode,
  departmentCode: DepartmentCode,
) =>
  `https://candidat.pole-emploi.fr/marche-du-travail/informationssurunmetier?codeMetier=${appellationCode}&codeZoneGeographique=${departmentCode}&typeZoneGeographique=DEPARTEMENT`;

export const makeNafClassInformationUrl = (naf: NafDto["code"]) =>
  `https://www.insee.fr/fr/metadonnees/nafr2/classe/${fromNafSubClassToNafClass(
    naf,
  )}?champRecherche=false`;
