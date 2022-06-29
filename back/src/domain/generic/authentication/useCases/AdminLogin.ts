import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { userAndPasswordSchema } from "shared/src/admin/admin.schema";
import { ForbiddenError } from "../../../../adapters/primary/helpers/httpErrors";
import { GenerateAdminJwt } from "../../../auth/jwt";
import { UseCase } from "../../../core/UseCase";

export class AdminLogin extends UseCase<UserAndPassword, AdminToken> {
  inputSchema = userAndPasswordSchema;

  constructor(
    private readonly correctUser: string,
    private readonly correctPassword: string,
    private readonly generateAdminToken: GenerateAdminJwt,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async _execute({ user, password }: UserAndPassword): Promise<AdminToken> {
    if (user !== this.correctUser || password !== this.correctPassword)
      throw new ForbiddenError("Les identifiants ne sont pas corrects");

    return this.generateAdminToken({ expiresIn: "365d" });
  }
}
