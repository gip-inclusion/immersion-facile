import { Builder } from "shared";
import { SireneApiEstablishment } from "../domain/sirene/ports/SirenGateway";
import { SirenEstablishmentVO } from "../domain/sirene/valueObjects/SirenEstablishmentVO";

const validSireneEstablishmentProps: SireneApiEstablishment = {
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
  periodesEtablissement: [
    {
      dateFin: null,
      dateDebut: "2022-01-01",
      etatAdministratifEtablissement: "A",
    },
  ],
};

export class SireneEstablishmentVOBuilder
  implements Builder<SirenEstablishmentVO>
{
  public constructor(
    private props: SireneApiEstablishment = validSireneEstablishmentProps,
  ) {}

  public withSiret(siret: string): SireneEstablishmentVOBuilder {
    return new SireneEstablishmentVOBuilder({
      ...this.props,
      siret,
    });
  }
  public withUniteLegale(
    uniteLegale: SireneApiEstablishment["uniteLegale"],
  ): SireneEstablishmentVOBuilder {
    return new SireneEstablishmentVOBuilder({
      ...this.props,
      uniteLegale,
    });
  }
  public withAdresseEtablissement(
    adresseEtablissement: SireneApiEstablishment["adresseEtablissement"],
  ): SireneEstablishmentVOBuilder {
    return new SireneEstablishmentVOBuilder({
      ...this.props,
      adresseEtablissement,
    });
  }
  build(): SirenEstablishmentVO {
    return new SirenEstablishmentVO(this.props);
  }
}
