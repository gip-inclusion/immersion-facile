import { Router } from "express";
import multer from "multer";
import * as path from "path";
import {
  featureFlagsRoute,
  renewMagicLinkRoute,
  uploadFileRoute,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  BadRequestError,
  FeatureDisabledError,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createTechnicalRouter = (deps: AppDependencies) => {
  const technicalRouter = Router();
  technicalRouter
    .route(`/${renewMagicLinkRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.renewConventionMagicLink.execute(req.query as any),
      ),
    );

  technicalRouter
    .route(`/${featureFlagsRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.useCases.getFeatureFlags.execute),
    );

  const upload = multer({ dest: path.join(deps.config.storageRoot, "tmp") });

  technicalRouter
    .route(`/${uploadFileRoute}`)
    .post(upload.single(uploadFileRoute), (req, res) =>
      sendHttpResponse(req, res, async () => {
        await rejectIfFeatureFlagNotActive(deps);

        if (!req.file) throw new BadRequestError("No file provided");

        return deps.useCases.uploadLogo.execute(req.file);
      }),
    );

  return technicalRouter;
};

const rejectIfFeatureFlagNotActive = async (
  deps: AppDependencies,
): Promise<void> | never => {
  const { enableLogoUpload } = await deps.useCases.getFeatureFlags.execute();
  if (!enableLogoUpload) {
    throw new FeatureDisabledError("Upload Logo");
  }
};
