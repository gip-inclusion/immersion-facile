import express from "express";

export interface AuthChecker {
  checkAuth: (request: express.Request) => void;
}

export const ALWAYS_REJECT = new class implements AuthChecker {
  public checkAuth(_req: express.Request) {
    return false;
  }
}
