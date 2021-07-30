import express, { Router } from "express";
import { todosRoute, formulairesRoute } from "../../shared/routes";
import { getUsecases } from "./config";
import bodyParser from "body-parser";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { todoDtoSchema } from "../../shared/TodoDto";
import { formulaireDtoSchema } from "../../shared/FormulaireDto";

const app = express();
const router = Router();

app.use(bodyParser.json());

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

app.use(router);

export { app };
