import { LaBonneBoiteCompany } from "../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { Builder } from "./Builder";

const validEstablishmentFromLaBonneBoite: LaBonneBoiteCompany = {
  address:
    "Service des ressources humaines,  IMPASSE FENDERIE, 57290 SEREMANGE-ERZANGE",
  city: "SEREMANGE-ERZANGE",
  lat: 49.3225,
  lon: 6.08067,
  matched_rome_code: "M1607",
  naf: "8810C",
  name: "BLANCHISSERIE LA FENSCH",
  siret: "77561959600155",
  stars: 4.5,
};

export class LaBonneBoiteCompanyBuilder
  implements Builder<LaBonneBoiteCompany>
{
  public constructor(
    private entity: LaBonneBoiteCompany = validEstablishmentFromLaBonneBoite,
  ) {}

  public withSiret(siret: string): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.entity,
      siret,
    });
  }

  public withNaf(naf: string): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.entity,
      naf,
    });
  }
  public build() {
    return this.entity;
  }
}
