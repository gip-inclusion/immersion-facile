import { AuthChecker } from "./AuthChecker";
import { UnauthorizedError } from "../../adapters/primary/helpers/sendHttpResponse";
import express from "express";

export class InMemoryAuthChecker implements AuthChecker {
  private readonly username: string;
  private readonly password: string;

  public static create(username: string, password: string) {
    return new InMemoryAuthChecker(username, password);
  }

  public constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  public checkAuth(req: express.Request) {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedError();
    }

    const [receivedUsername, receivedPassword] = Buffer.from(
      authorization.replace("Basic ", ""),
      "base64",
    )
      .toString()
      .split(":");
    if (
      !(
        receivedUsername === this.username && receivedPassword === this.password
      )
    ) {
      throw new UnauthorizedError(); // TODO: Return a ForbiddenError.
    }
  }
}
