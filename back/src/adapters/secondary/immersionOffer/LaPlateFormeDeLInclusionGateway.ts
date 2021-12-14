import { v4 as uuidV4 } from "uuid";
import { UncompleteEstablishmentEntity } from "../../../domain/immersionOffer/entities/UncompleteEstablishmentEntity";
import { EstablishmentsGateway } from "../../../domain/immersionOffer/ports/EstablishmentsGateway";
import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";
import {
  LaPlateformeDeLInclusionAPI,
  LaPlateformeDeLInclusionResult,
} from "./../../../domain/immersionOffer/ports/LaPlateformeDeLInclusionAPI";

const logger = createLogger(__filename);

export const convertLaPlateFormeDeLInclusionToUncompletEstablishment = (
  establishment: LaPlateformeDeLInclusionResult,
): UncompleteEstablishmentEntity => {
  const { addresse_ligne_1, addresse_ligne_2, code_postal, ville } =
    establishment;

  return new UncompleteEstablishmentEntity({
    id: uuidV4(),
    address: `${addresse_ligne_1} ${addresse_ligne_2} ${code_postal} ${ville}`,
    score: 6,
    voluntaryToImmersion: false,
    romes: establishment.postes.map((poste) =>
      poste.rome.substring(poste.rome.length - 6, poste.rome.length - 1),
    ),
    siret: establishment.siret,
    dataSource: "api_laplateformedelinclusion",
    name: establishment.enseigne,
  });
};

export class LaPlateFormeDeLInclusionGateway implements EstablishmentsGateway {
  constructor(
    private readonly laPlateformeDeLInclusionApi: LaPlateformeDeLInclusionAPI,
  ) {}

  async getEstablishments(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    logger.debug({ searchParams }, "getEstablishments");
    const results = await this.laPlateformeDeLInclusionApi.getResults(
      searchParams,
    );
    return results.map(convertLaPlateFormeDeLInclusionToUncompletEstablishment);
  }
}
