import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { createLogger } from "../../utils/logger";
import { CachingAccessTokenGateway } from "../secondary/core/CachingAccessTokenGateway";
import { APIAdresseGateway } from "../secondary/immersionOffer/APIAdresseGateway";
import {
  httpCallToLaBonneBoite,
  LaBonneBoiteGateway,
} from "../secondary/immersionOffer/LaBonneBoiteGateway";
import {
  httpCallToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
} from "../secondary/immersionOffer/LaPlateFormeDeLInclusionGateway";
import { PoleEmploiAccessTokenGateway } from "../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "./appConfig";
import { createGetPgPoolFn, createRepositories } from "./config";

const logger = createLogger(__filename);

const main = async () => {
  logger.info(`Executing pipeline: establishment-backfill`);

  // TODO(nsw): Refactor config.ts to create dependencies on demand so that we can keep all the
  // dependency creation and injection in a single file and reuse it across multiple binaries.

  const config = AppConfig.createFromEnv();

  const poleEmploiAccessTokenGateway = new CachingAccessTokenGateway(
    new PoleEmploiAccessTokenGateway(config.poleEmploiAccessTokenConfig),
  );

  const laBonneBoite = new LaBonneBoiteGateway(
    poleEmploiAccessTokenGateway,
    config.poleEmploiClientId,
    httpCallToLaBonneBoite,
  );

  const laPlateFormeDeLInclusion = new LaPlateFormeDeLInclusionGateway(
    httpCallToLaPlateFormeDeLInclusion,
  );

  const addressGateway = new APIAdresseGateway();

  const repositories = await createRepositories(
    config,
    createGetPgPoolFn(config),
  );

  const updateEstablishmentsAndImmersionOffersFromLastSearches =
    new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
      laBonneBoite,
      laPlateFormeDeLInclusion,
      addressGateway.getGPSFromAddressAPIAdresse,
      repositories.sirene,
      repositories.immersionOfferForSearch,
    );

  await updateEstablishmentsAndImmersionOffersFromLastSearches.execute();
};

main();
