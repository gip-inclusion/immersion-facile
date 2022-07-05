import { Router } from "express";
import multer from "multer";
import {
  getFeatureFlags,
  renewMagicLinkRoute,
  uploadFileRoute,
} from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { FeatureDisabledError } from "../helpers/httpErrors";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createTechnicalRouter = (deps: AppDependencies) => {
  const technicalRouter = Router();
  technicalRouter.route(`/${renewMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.renewConventionMagicLink.execute({
        expiredJwt: req.query.expiredJwt,
        linkFormat: req.query.linkFormat,
      } as any),
    ),
  );

  technicalRouter
    .route(`/${getFeatureFlags}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.repositories.getFeatureFlags),
    );

  const upload = multer({ dest: "storage/tmp" });

  technicalRouter
    .route(`/${uploadFileRoute}`)
    .post(upload.single(uploadFileRoute), (req, res) =>
      sendHttpResponse(req, res, async () => {
        const { enableLogoUpload } = await deps.repositories.getFeatureFlags();
        if (!enableLogoUpload) {
          throw new FeatureDisabledError("Upload Logo");
        }

        if (!req.file) throw new Error("No file uploaded");
        return deps.useCases.uploadFile.execute({
          name: req.file.originalname,
          encoding: req.file.encoding,
          size: req.file.size,
          path: req.file.path,
        });
      }),
    );

  return technicalRouter;
};
