import { Router } from "express";
import { IpFilter } from "express-ipfilter";
import multer from "multer";
import { technicalRoutes, uploadFileRoute } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { BadRequestError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { sendRedirectResponse } from "../../helpers/sendRedirectResponse";
import { createOpenApiSpecV2 } from "../apiKeyAuthRouter/createOpenApiV2";

export const createTechnicalRouter = (
  deps: AppDependencies,
  inboundEmailAllowIps: string[],
) => {
  const technicalRouter = Router();

  const upload = multer({ storage: multer.memoryStorage() });

  technicalRouter
    .route(`/${uploadFileRoute}`)
    .post(upload.single(uploadFileRoute), (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.file) throw new BadRequestError("No file provided");
        return deps.useCases.uploadLogo.execute(req.file);
      }),
    );

  const technicalSharedRouter = createExpressSharedRouter(
    technicalRoutes,
    technicalRouter,
  );

  technicalSharedRouter.inboundEmailParsing(
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

  technicalSharedRouter.openApiSpec(async (req, res) =>
    sendHttpResponse(req, res, () =>
      Promise.resolve(createOpenApiSpecV2(deps.config.envType)),
    ),
  );

  technicalSharedRouter.shortLink(async (req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.getLink.execute(req.params.shortLinkId),
    ),
  );

  technicalSharedRouter.featureFlags(async (req, res) =>
    sendHttpResponse(req, res, deps.useCases.getFeatureFlags.execute),
  );

  technicalSharedRouter.htmlToPdf(
    deps.conventionMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.htmlToPdf.execute(
          req.body.htmlContent,
          req.payloads?.backOffice ?? req.payloads?.convention,
        ),
      ),
  );

  technicalSharedRouter.validateEmail(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.validateEmail.execute(req.query),
    ),
  );

  return technicalRouter;
};
