import {
  LaPlateFormeDeLInclusionPoste,
  LaPlateformeDeLInclusionResult,
} from "../domain/immersionOffer/ports/LaPlateformeDeLInclusionAPI";
import { Builder } from "./Builder";

const validLaPlateformeDeLInclusionResult: LaPlateformeDeLInclusionResult = {
  cree_le: new Date("2019-12-05T15:37:56.609000+01:00"),
  mis_a_jour_le: new Date("2020-10-08T17:29:40.320879+02:00"),
  siret: "20006765000016",
  type: "ACI",
  raison_sociale: "COMMUNAUTE DE COM HOUVE PAYS BOULAGEOIS",
  enseigne: "Communaute de com houve pays boulageois",
  site_web: "",
  description: "",
  bloque_candidatures: false,
  addresse_ligne_1: "29 Rue de Sarrelouis",
  addresse_ligne_2: "",
  code_postal: "57220",
  ville: "Boulay-Moselle",
  departement: "57",
  postes: [],
};

export class LaPlateformeDeLInclusionResultBuilder
  implements Builder<LaPlateformeDeLInclusionResult>
{
  public constructor(
    private entity: LaPlateformeDeLInclusionResult = validLaPlateformeDeLInclusionResult,
  ) {}

  public withSiret(siret: string): LaPlateformeDeLInclusionResultBuilder {
    return new LaPlateformeDeLInclusionResultBuilder({
      ...this.entity,
      siret,
    });
  }
  public withPostes(
    postes: LaPlateFormeDeLInclusionPoste[],
  ): LaPlateformeDeLInclusionResultBuilder {
    return new LaPlateformeDeLInclusionResultBuilder({
      ...this.entity,
      postes,
    });
  }
  public build() {
    return this.entity;
  }
}
