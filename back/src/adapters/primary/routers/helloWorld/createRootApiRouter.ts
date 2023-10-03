import { Router } from "express";

export const createRootApiRouter = () => {
  const helloWorldRouter = Router();
  helloWorldRouter.route("/").get((_req, res) =>
    res.json({
      message:
        "Api documentation is here : https://immersion-facile.beta.gouv.fr/doc-api",
    }),
  );
  return helloWorldRouter;
};
