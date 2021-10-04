import { Router } from "express";
import { authMiddleware } from "./authMiddleware";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { demandesImmersionRoute } from "../../shared/routes";
import { AppConfig } from "./config";

export const createMagicLinkRouter = (config: AppConfig) => {
  const authenticatedRouter = Router({ mergeParams: true });
  authenticatedRouter.use("/:jwt", authMiddleware);

  authenticatedRouter
    .use(`/:jwt`, authMiddleware)
    .route(`/:jwt/auth-test`)
    .get(async (req, res) => {
      console.log("Payload : ", req.jwtPayload);
      res.json({ yolo: "reached here  !" });
    });

  authenticatedRouter
    .route(`/${demandesImmersionRoute}`)
    .get(async (req, res) => {
      sendHttpResponse(
        req,
        res,
        () => config.useCases.listDemandeImmersion.execute(),
      );
    });

  return authenticatedRouter;
};
