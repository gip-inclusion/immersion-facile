import { BackOfficeJwt, UserAndPassword, userAndPasswordSchema } from "shared";
import { ForbiddenError } from "../../../../adapters/primary/helpers/httpErrors";
import { GenerateAdminJwt } from "../../../auth/jwt";
import { UseCase } from "../../../core/UseCase";

export class AdminLogin extends UseCase<UserAndPassword, BackOfficeJwt> {
  inputSchema = userAndPasswordSchema;

  constructor(
    private readonly correctUser: string,
    private readonly correctPassword: string,
    private readonly generateAdminToken: GenerateAdminJwt,
    private readonly wait: () => Promise<void>,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async _execute({ user, password }: UserAndPassword): Promise<BackOfficeJwt> {
    // as this route is public, it could be brut forced
    // we don't want a fast responding route, to avoid the possibility of many calls in a short time
    // this is why we add a delay of 0.5 seconds
    await this.wait();
    if (user !== this.correctUser || password !== this.correctPassword)
      throw new ForbiddenError("Wrong credentials");

    return this.generateAdminToken({});
  }
}
