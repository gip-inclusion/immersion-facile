import { Router } from "express";
import { addressTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAddressRouter = (deps: AppDependencies) => {
  const addressRouter = Router();

  addressRouter
    .route(addressTargets.lookupStreetAddress.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.lookupStreetAddress.execute(req.query as any),
      ),
    );

  addressRouter
    .route(addressTargets.lookupLocation.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.lookupLocation.execute(req.query as any),
      ),
    );
  addressRouter
    .route(addressTargets.departmentCodeFromPostcode.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.departmentCodeFromPostcode.execute(req.query as any),
      ),
    );

  return addressRouter;
};
