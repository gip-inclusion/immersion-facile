import { createHmac } from "crypto";
import { Router } from "express";
import { IpFilter } from "express-ipfilter";
import multer from "multer";
import { technicalRoutes, uploadFileRoute } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import {
  BadRequestError,
  ForbiddenError,
} from "../../../../config/helpers/httpErrors";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { sendRedirectResponse } from "../../../../config/helpers/sendRedirectResponse";
import { UploadFileInput } from "../../../../domains/core/file-storage/useCases/UploadFile";
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
        const params: UploadFileInput = {
          multerFile: req.file,
          renameFileToId: req.body?.renameFileToId.toLowerCase() === "true",
        };
        return deps.useCases.uploadFile.execute(params);
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

  technicalSharedRouter.npsValidatedConvention(async (req, res) =>
    sendHttpResponse(req, res, () => {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log("body => ", req.body);
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log("headers => ", req.headers);
      const receivedSignature = req.headers["tally-signature"];

      const calculatedSignature = createHmac(
        "sha256",
        deps.config.tallySignatureSecret,
      )
        .update(JSON.stringify(req.body))
        .digest("base64");

      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log({
        receivedSignature,
        calculatedSignature,
      });

      if (receivedSignature !== calculatedSignature) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log("missamtch ");
        throw new ForbiddenError("Missmatch Tally signature");
      }

      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log("success ");

      return Promise.resolve();
    }),
  );

  return technicalRouter;
};
