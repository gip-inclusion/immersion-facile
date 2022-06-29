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
      async (_) => {
        /* do not wait in case of unit tests */
      },
    );
  });

  it("throws Forbidden if user and password are not corret", async () => {
    await expectPromiseToFailWithError(
      adminLogin.execute({ user: "user", password: "password" }),
      new ForbiddenError("Wrong credentials"),
    );

    await expectPromiseToFailWithError(
      adminLogin.execute({ user: "lala", password: "pwd" }),
      new ForbiddenError("Wrong credentials"),
    );
  });

  it("returns a jwt when user and password match", async () => {
    const token = await adminLogin.execute({ user: "user", password: "pwd" });
    expect(token).toBe(correctToken + "365d");
  });
});
