import { Builder } from "shared";
import {
  LaBonneBoiteCompanyProps,
  LaBonneBoiteCompanyVO,
} from "../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";

const validEstablishmentFromLaBonneBoite: LaBonneBoiteCompanyProps = {
  address:
    "Service des ressources humaines,  IMPASSE FENDERIE, 57290 SEREMANGE-ERZANGE",
  city: "SEREMANGE-ERZANGE",
  lat: 49.3225,
  lon: 6.08067,
  matched_rome_code: "M1607",
  matched_rome_label: "Some label",
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

export class LaBonneBoiteCompanyVOBuilder
  implements Builder<LaBonneBoiteCompanyVO>
{
  public constructor(
    private props: LaBonneBoiteCompanyProps = validEstablishmentFromLaBonneBoite,
  ) {}

  public withSiret(siret: string): LaBonneBoiteCompanyVOBuilder {
    return new LaBonneBoiteCompanyVOBuilder({
      ...this.props,
      siret,
    });
  }

  public withNaf(naf: string): LaBonneBoiteCompanyVOBuilder {
    return new LaBonneBoiteCompanyVOBuilder({
      ...this.props,
      naf,
    });
  }

  public withRome(rome: string): LaBonneBoiteCompanyVOBuilder {
    return new LaBonneBoiteCompanyVOBuilder({
      ...this.props,
      matched_rome_code: rome,
    });
  }

  public withStars(stars: number): LaBonneBoiteCompanyVOBuilder {
    return new LaBonneBoiteCompanyVOBuilder({
      ...this.props,
      stars,
    });
  }
  public withMatchedRomeCode(
    matchedRomeCode: string,
  ): LaBonneBoiteCompanyVOBuilder {
    return new LaBonneBoiteCompanyVOBuilder({
      ...this.props,
      matched_rome_code: matchedRomeCode,
    });
  }
  public build() {
    return new LaBonneBoiteCompanyVO(this.props);
  }
}
