import { Router } from "express";
import { IpFilter } from "express-ipfilter";
import multer from "multer";
import {
  featureFlagsRoute,
  inboundEmailParsingRoute,
  renewMagicLinkRoute,
  shortLinkRoute,
  uploadFileRoute,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  BadRequestError,
  FeatureDisabledError,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { sendRedirectResponse } from "../../helpers/sendRedirectResponse";
import { openApiSpecV2 } from "../apiKeyAuthRouter/createOpenApiV2";

export const createTechnicalRouter = (
  deps: AppDependencies,
  inboundEmailAllowIps: string[],
) => {
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

  const upload = multer({ storage: multer.memoryStorage() });

  technicalRouter
    .route(`/${uploadFileRoute}`)
    .post(upload.single(uploadFileRoute), (req, res) =>
      sendHttpResponse(req, res, async () => {
        await rejectIfFeatureFlagNotActive(deps);

        if (!req.file) throw new BadRequestError("No file provided");

        return deps.useCases.uploadLogo.execute(req.file);
      }),
    );

  technicalRouter
    .route(`/${shortLinkRoute}/:shortLinkId`)
    .get(async (req, res) =>
      sendRedirectResponse(req, res, () =>
        deps.useCases.getLink.execute(req.params.shortLinkId),
      ),
    );

  technicalRouter
    .route(`/open-api-spec`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () => Promise.resolve(openApiSpecV2)),
    );

  technicalRouter.route(`/${inboundEmailParsingRoute}`).post(
    IpFilter(inboundEmailAllowIps, {
      mode: "allow",
      logLevel: "deny",
      detectIp: (req) => {
        const rawHeaders = req.headers["x-forwarded-for"];
        if (!rawHeaders) return "";
        if (typeof rawHeaders === "string") {
          return rawHeaders.split(",")[0];
        }
        return rawHeaders[0];
      },
    }),
    async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addExchangeToDiscussionAndSendEmail.execute(req.body),
      ),
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
