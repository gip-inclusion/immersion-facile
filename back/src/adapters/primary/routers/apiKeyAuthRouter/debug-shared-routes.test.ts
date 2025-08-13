import bodyParser from "body-parser";
import express, { Router as ExpressRouter } from "express";
import { defineRoute, defineRoutes } from "shared-routes";
import { createExpressSharedRouter } from "shared-routes/express";
import type { ExpressSharedRouterOptions } from "shared-routes/express/createExpressSharedRouter";
import type { StandardSchemaV1 } from "shared-routes/standardSchemaUtils";
import { createSupertestSharedClient } from "shared-routes/supertest";
import supertest from "supertest";
import { z } from "zod";

const withAuthorizationSchema = z.object({ authorization: z.string() });

const testUnionSchema = z.union([
  z.object({ type: z.literal("A"), value: z.string() }),
  z.object({ type: z.literal("B"), count: z.number() }),
]);

const routes = defineRoutes({
  addComplexItem: defineRoute({
    method: "post",
    url: "/complex-item",
    requestBodySchema: testUnionSchema,
    headersSchema: withAuthorizationSchema,
  }),
});

const fakeAuthToken = "my-token";

type WithExpressSharedRouterOptions = {
  expressSharedRouterOptions: ExpressSharedRouterOptions;
};

const createBookRouter = (
  config: WithExpressSharedRouterOptions | void,
): ExpressRouter => {
  const expressRouter = ExpressRouter();

  const expressSharedRouter = createExpressSharedRouter(
    routes,
    expressRouter,
    config?.expressSharedRouterOptions,
  );

  const someMiddleware: express.RequestHandler = (_req, _res, next) => {
    next();
  };

  expressSharedRouter.addComplexItem(someMiddleware, (req, res) => {
    if (req.headers.authorization !== fakeAuthToken) {
      res.status(401);
      return res.json();
    }
    return res.json();
  });

  return expressRouter;
};

const createExempleApp = (config: WithExpressSharedRouterOptions | void) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(createBookRouter(config));
  return app;
};

describe("createExpressSharedRouter and createSupertestSharedCaller", () => {
  describe("when providing a function onInputValidationError", () => {
    it("fails if the schema is not respected", async () => {
      const calledWith: any[] = [];
      const app = createExempleApp({
        expressSharedRouterOptions: {
          onInputValidationError: (error: StandardSchemaV1.FailureResult) => {
            calledWith.push(error);
            return error;
          },
        },
      });

      const supertestRequest = supertest(app);
      const supertestSharedCaller = createSupertestSharedClient(
        routes,
        supertestRequest,
      );

      const response = await supertestSharedCaller.addComplexItem({
        body: {
          type: "C",
          value: "test",
        } as any,
        headers: { authorization: fakeAuthToken },
      });

      // biome-ignore lint/suspicious/noConsole: debug purpose
      console.log({ response: JSON.stringify(response) });
      // biome-ignore lint/suspicious/noConsole: debug purpose
      console.log({ calledWith });
      // biome-ignore lint/suspicious/noConsole: debug purpose
      console.log({ calledWithIssues: calledWith[0]?.issues });
      // biome-ignore lint/suspicious/noConsole: debug purpose
      console.log({ calledWithError: JSON.stringify(calledWith[0], null, 2) });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 400,
        message:
          "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /complex-item",
        issues: [
          'type : Invalid input: expected "A"',
          'type : Invalid input: expected "B"',
          "count : Invalid input: expected number, received undefined",
        ],
      });
    });
  });
});
