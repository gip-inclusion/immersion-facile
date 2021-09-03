import express, { Router } from "express";
import PinoHttp from "pino-http";
import {
  todosRoute,
  demandesImmersionRoute,
  siretRoute,
} from "../../shared/routes";
import { getUsecases, getAuthChecker } from "./config";
import bodyParser from "body-parser";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { todoDtoSchema } from "../../shared/TodoDto";
import {
  demandeImmersionDtoSchema,
  getDemandeImmersionRequestDtoSchema,
  updateDemandeImmersionRequestDtoSchema,
} from "../../shared/DemandeImmersionDto";
import { logger } from "../../utils/logger";
import { resolveProjectReferencePath } from "typescript";

const app = express();
const router = Router();

app.use(bodyParser.json());

if (process.env.NODE_ENV !== "test") {
  app.use(PinoHttp({ logger }));
}

router.route("/").get((req, res) => {
  return res.json({ message: "Hello World !" });
});

const authChecker = getAuthChecker();
const useCases = getUsecases();

router
  .route(`/${todosRoute}`)
  .post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: useCases.addTodo,
        validationSchema: todoDtoSchema,
        useCaseParams: req.body,
      })
    )
  )
  .get(async (req, res) =>
    sendHttpResponse(req, res, () => useCases.listTodos.execute())
  );

router
  .route(`/${demandesImmersionRoute}`)
  .post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: useCases.addDemandeImmersion,
        validationSchema: demandeImmersionDtoSchema,
        useCaseParams: req.body,
      })
    )
  )
  .get(async (req, res) => {
    sendHttpResponse(
      req,
      res,
      () => useCases.listDemandeImmersion.execute(),
      authChecker
    );
  });

const uniqueDemandeImmersionRouter = Router({ mergeParams: true });
router.use(`/${demandesImmersionRoute}`, uniqueDemandeImmersionRouter);

uniqueDemandeImmersionRouter
  .route(`/:id`)
  .get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: useCases.getDemandeImmersion,
        validationSchema: getDemandeImmersionRequestDtoSchema,
        useCaseParams: req.params,
      })
    )
  )
  .post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: useCases.updateDemandeImmersion,
        validationSchema: updateDemandeImmersionRequestDtoSchema,
        useCaseParams: { id: req.params.id, demandeImmersion: req.body },
      })
    )
  );

router.route(`/${siretRoute}/:siret`).get(async (req, res) =>
  sendHttpResponse(req, res, async () => {
    logger.info(req);
    return useCases.getSiret.execute(req.params.siret);
  })
);

app.use(router);

export { app };
