import express, { Router } from "express";
import PinoHttp from "pino-http";
import { todosRoute, formulairesRoute } from "../../shared/routes";
import { getUsecases } from "./config";
import bodyParser from "body-parser";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { todoDtoSchema } from "../../shared/TodoDto";
import {
  formulaireDtoSchema,
  getFormulaireRequestDtoSchema,
  updateFormulaireRequestDtoSchema,
} from "../../shared/FormulaireDto";
import { logger } from "../../utils/logger";
import { UpdateFormulaire } from "../../domain/formulaires/useCases/UpdateFormulaire";

const app = express();
const router = Router();

app.use(bodyParser.json());

if (process.env.NODE_ENV !== "test") {
  app.use(PinoHttp({ logger }));
}

router.route("/").get((req, res) => {
  return res.json({ message: "Hello World !" });
});

const useCases = getUsecases();

router
  .route(`/${todosRoute}`)
  .post(async (req, res) =>
    sendHttpResponse(res, () =>
      callUseCase({
        useCase: useCases.addTodo,
        validationSchema: todoDtoSchema,
        useCaseParams: req.body,
      })
    )
  )
  .get(async (req, res) =>
    sendHttpResponse(res, () => useCases.listTodos.execute())
  );

router
  .route(`/${formulairesRoute}`)
  .post(async (req, res) =>
    sendHttpResponse(res, () =>
      callUseCase({
        useCase: useCases.addFormulaire,
        validationSchema: formulaireDtoSchema,
        useCaseParams: req.body,
      })
    )
  )
  .get(async (req, res) =>
    sendHttpResponse(res, () => useCases.listFormulaires.execute())
  );

const uniqueFormulaireRouter = Router({ mergeParams: true });
router.use(`/${formulairesRoute}`, uniqueFormulaireRouter);

uniqueFormulaireRouter
  .route(`/:id`)
  .get(async (req, res) =>
    sendHttpResponse(res, () =>
      callUseCase({
        useCase: useCases.getFormulaire,
        validationSchema: getFormulaireRequestDtoSchema,
        useCaseParams: req.params,
      })
    )
  )
  .post(async (req, res) =>
    sendHttpResponse(res, () =>
      callUseCase({
        useCase: useCases.updateFormulaire,
        validationSchema: updateFormulaireRequestDtoSchema,
        useCaseParams: { id: req.params.id, formulaire: req.body },
      })
    )
  );

app.use(router);

export { app };
