import express from "express";
import { ForbiddenError } from "../../adapters/primary/helpers/sendHttpResponse";

export interface AuthChecker {
  checkAuth: (request: express.Request) => void;
}

export const ALWAYS_REJECT = new (class implements AuthChecker {
  public checkAuth(_req: express.Request) {
    throw new ForbiddenError();
  }
})();
