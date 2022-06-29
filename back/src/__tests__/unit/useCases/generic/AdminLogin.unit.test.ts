import { expectPromiseToFailWithError } from "../../../../_testBuilders/test.helpers";
import { ForbiddenError } from "../../../../adapters/primary/helpers/httpErrors";
import { AdminLogin } from "../../../../domain/generic/authentication/useCases/AdminLogin";

const correctToken = "the-token";

describe("AdminLogin", () => {
  let adminLogin: AdminLogin;
  beforeEach(() => {
    adminLogin = new AdminLogin(
      "user",
      "pwd",
      (payload) => correctToken + payload.expiresIn,
    );
  });

  it("throws Forbidden if user and password are not corret", async () => {
    await expectPromiseToFailWithError(
      adminLogin.execute({ user: "user", password: "password" }),
      new ForbiddenError("Les identifiants ne sont pas corrects"),
    );

    await expectPromiseToFailWithError(
      adminLogin.execute({ user: "lala", password: "pwd" }),
      new ForbiddenError("Les identifiants ne sont pas corrects"),
    );
  });

  it("returns a jwt when user and password match", async () => {
    const token = await adminLogin.execute({ user: "user", password: "pwd" });
    expect(token).toBe(correctToken + "365d");
  });
});
