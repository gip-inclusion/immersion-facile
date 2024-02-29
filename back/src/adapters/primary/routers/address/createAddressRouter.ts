import { Router } from "express";
import { addressRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createAddressRouter = (deps: AppDependencies) => {
  const addressRouter = Router();

  const sharedRouter = createExpressSharedRouter(addressRoutes, addressRouter);

  sharedRouter.lookupStreetAddress(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.lookupStreetAddress.execute(req.query as any),
    ),
  );

  sharedRouter.lookupLocation(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.lookupLocation.execute(req.query as any),
    ),
  );

  return addressRouter;
};
