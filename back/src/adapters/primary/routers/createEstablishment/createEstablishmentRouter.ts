import { Router } from "express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { establishmentRouterWithJwt } from "./establishmentRouterWithJwt";
import { establismentRouterWithoutJwt } from "./establismentRouterWithoutJwt";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });
  establishmentRouter.use(establismentRouterWithoutJwt(deps));
  establishmentRouter.use(establishmentRouterWithJwt(deps));
  return establishmentRouter;
};
