import { type NafDto, fromNafSubClassToNafClass } from "../naf/naf.dto";
import type { RomeCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const makeAppellationInformationUrl = (romeCode: RomeCode) =>
  `https://candidat.francetravail.fr/metierscope/fiche-metier/${romeCode}`;
export const makeNafClassInformationUrl = (naf: NafDto["code"]) =>
  `https://www.insee.fr/fr/metadonnees/nafr2/classe/${fromNafSubClassToNafClass(
    naf,
  )}?champRecherche=false`;
