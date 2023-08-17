import { addDays } from "date-fns";
import { BackOfficeJwt, UserAndPassword, userAndPasswordSchema } from "shared";
import { ForbiddenError } from "../../../../adapters/primary/helpers/httpErrors";
import { GenerateBackOfficeJwt } from "../../../auth/jwt";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import { UseCase } from "../../../core/UseCase";

export class AdminLogin extends UseCase<UserAndPassword, BackOfficeJwt> {
  protected inputSchema = userAndPasswordSchema;

  readonly #correctUser: string;

  readonly #correctPassword: string;

  readonly #generateAdminToken: GenerateBackOfficeJwt;

  readonly #wait: () => Promise<void>;

  readonly #timeGateway: TimeGateway;

  constructor(
    correctUser: string,
    correctPassword: string,
    generateAdminToken: GenerateBackOfficeJwt,
    wait: () => Promise<void>,
    timeGateway: TimeGateway,
  ) {
    super();

    this.#correctPassword = correctPassword;
    this.#correctUser = correctUser;
    this.#generateAdminToken = generateAdminToken;
    this.#wait = wait;
    this.#timeGateway = timeGateway;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _execute({
    user,
    password,
  }: UserAndPassword): Promise<BackOfficeJwt> {
    // as this route is public, it could be brut forced
    // we don't want a fast responding route, to avoid the possibility of many calls in a short time
    // this is why we add a delay of 0.5 seconds
    await this.#wait();
    if (user !== this.#correctUser || password !== this.#correctPassword)
      throw new ForbiddenError("Wrong credentials");

    return this.#generateAdminToken({
      role: "backOffice",
      sub: this.#correctUser,
      version: 1,
      iat: Math.round(this.#timeGateway.now().getTime() / 1000),
      exp: Math.round(addDays(this.#timeGateway.now(), 365).getTime() / 1000),
    });
  }
}
