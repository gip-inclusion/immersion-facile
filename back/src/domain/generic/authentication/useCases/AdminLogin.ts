import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { userAndPasswordSchema } from "shared/src/admin/admin.schema";
import { SleepFn } from "shared/src/utils";
import { ForbiddenError } from "../../../../adapters/primary/helpers/httpErrors";
import { GenerateAdminJwt } from "../../../auth/jwt";
import { UseCase } from "../../../core/UseCase";

export class AdminLogin extends UseCase<UserAndPassword, AdminToken> {
  inputSchema = userAndPasswordSchema;

  constructor(
    private readonly correctUser: string,
    private readonly correctPassword: string,
    private readonly generateAdminToken: GenerateAdminJwt,
    private readonly sleep: SleepFn,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async _execute({ user, password }: UserAndPassword): Promise<AdminToken> {
    // as this route is public, it could be brut forced
    // we don't want a fast responding route, to avoid the possibility of many calls in a short time
    // this is why we add a delay of 0.5 seconds
    await this.sleep(500);
    if (user !== this.correctUser || password !== this.correctPassword)
      throw new ForbiddenError("Wrong credentials");

    return this.generateAdminToken({ expiresIn: "365d" });
  }
}
