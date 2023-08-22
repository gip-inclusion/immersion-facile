import { firstValueFrom } from "rxjs";
import { AdminTargets, adminTargets, createManagedAxiosInstance } from "shared";
import { configureHttpClient, createAxiosHandlerCreator } from "http-client";
import { HttpAdminGateway } from "src/core-logic/adapters/AdminGateway/HttpAdminGateway";

describe("HttpAdminGateway", () => {
  let adminGateway: HttpAdminGateway;
  beforeEach(() => {
    const axiosInstance = createManagedAxiosInstance({
      baseURL: "http://localhost:1234",
    });
    const createHttpClient = configureHttpClient(
      createAxiosHandlerCreator(axiosInstance),
    );
    adminGateway = new HttpAdminGateway(
      createHttpClient<AdminTargets>(adminTargets),
    );
  });

  it("fails when credential are wrong", async () => {
    const promise = firstValueFrom(
      adminGateway.login$({ user: "lala", password: "bob" }),
    );
    await expect(promise).rejects.toThrow(
      "Request failed with status code 403",
    );
  });

  it("returns jwt if credentials are good", async () => {
    const response = await firstValueFrom(
      adminGateway.login$({ user: "admin", password: "admin" }), // depends on .env BACKOFFICE_* settings
    );
    expect(typeof response).toBe("string");
    expect(response.split(".")).toHaveLength(3);
  });
});
