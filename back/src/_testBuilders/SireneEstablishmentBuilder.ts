import { SireneEstablishment } from "../domain/sirene/ports/SireneRepository";
import { Builder } from "./Builder";

const validSireneEstablishment: SireneEstablishment = {
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

export class SireneEstablishmentBuilder
  implements Builder<SireneEstablishment>
{
  constructor(
    private readonly entity: SireneEstablishment = validSireneEstablishment,
  ) {}

  public withSiret(siret: string): SireneEstablishmentBuilder {
    return new SireneEstablishmentBuilder({
      ...this.entity,
      siret,
    });
  }
  build() {
    return this.entity;
  }
}
