import { Router } from "express";
import { immersionOffersRoute } from "shared/src/routes";
import { createLogger } from "../../../utils/logger";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import { v4 as uuidV4 } from "uuid";

const logger = createLogger(__filename);

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  const searchImmersionRouter = Router();

  searchImmersionRouter
    .route(`/${immersionOffersRoute}`)
    .get(async (req, res) => {
      const followString = `Search Immersion ${uuidV4()} -`;
      logger.info({ query: req.query }, followString);
      return sendHttpResponse(req, res, async () => {
        logger.info(`${followString} Calling LBB and updating if needed`);
        await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
          req.query as any,
        );
        logger.info(`${followString} LBB called, about to search in data`);
        const result = await deps.useCases.searchImmersion.execute(
          req.query as any,
          req.apiConsumer,
        );
        logger.info(`${followString} Success, ${result.length} results`);
        return result;
      });
    });
  return searchImmersionRouter;
};
