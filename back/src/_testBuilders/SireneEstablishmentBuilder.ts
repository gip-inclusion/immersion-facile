import {
  SireneEstablishmentVO,
  SireneEstablishmentProps,
} from "../domain/sirene/ports/SireneRepository";
import { Builder } from "./Builder";

const validSireneEstablishmentProps: SireneEstablishmentProps = {
  siret: "20006765000016",
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE 2",
    activitePrincipaleUniteLegale: "85.59A",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

export class SireneEstablishmentVOBuilder
  implements Builder<SireneEstablishmentVO>
{
  public constructor(
    private props: SireneEstablishmentProps = validSireneEstablishmentProps,
  ) {}

  public withSiret(siret: string): SireneEstablishmentVOBuilder {
    return new SireneEstablishmentVOBuilder({
      ...this.props,
      siret,
    });
  }
  public withUniteLegale(
    uniteLegale: SireneEstablishmentProps["uniteLegale"],
  ): SireneEstablishmentVOBuilder {
    return new SireneEstablishmentVOBuilder({
      ...this.props,
      uniteLegale,
    });
  }
  public withAdresseEtablissement(
    adresseEtablissement: SireneEstablishmentProps["adresseEtablissement"],
  ): SireneEstablishmentVOBuilder {
    return new SireneEstablishmentVOBuilder({
      ...this.props,
      adresseEtablissement,
    });
  }
  build(): SireneEstablishmentVO {
    return new SireneEstablishmentVO(this.props);
  }
}
