import {
  LaBonneBoiteCompanyVO,
  LaBonneBoiteCompanyProps,
} from "../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";
import { Builder } from "shared/src/Builder";

const validEstablishmentFromLaBonneBoite: LaBonneBoiteCompanyProps = {
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
  url: "",
  headcount_text: "",
  distance: 10,
  alternance: false,
  contact_mode: "phone",
  raison_sociale: "",
  naf_text: "",
  social_network: "",
  boosted: false,
  website: "",
};

export class LaBonneBoiteCompanyBuilder
  implements Builder<LaBonneBoiteCompanyVO>
{
  public constructor(
    private props: LaBonneBoiteCompanyProps = validEstablishmentFromLaBonneBoite,
  ) {}

  public withSiret(siret: string): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.props,
      siret,
    });
  }

  public withNaf(naf: string): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.props,
      naf,
    });
  }

  public withRome(rome: string): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.props,
      matched_rome_code: rome,
    });
  }

  public withStars(stars: number): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.props,
      stars,
    });
  }
  public withMatchedRomeCode(
    matchedRomeCode: string,
  ): LaBonneBoiteCompanyBuilder {
    return new LaBonneBoiteCompanyBuilder({
      ...this.props,
      matched_rome_code: matchedRomeCode,
    });
  }
  public build() {
    return new LaBonneBoiteCompanyVO(this.props);
  }
}
