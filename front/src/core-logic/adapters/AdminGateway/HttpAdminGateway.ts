import axios, { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { adminLogin } from "shared/src/routes";
import { validateDataFromSchema } from "shared/src/zodUtils";
import { adminTokenSchema } from "shared/src/admin/admin.schema";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

const prefix = "api";

export class HttpAdminGateway implements AdminGateway {
  private axiosInstance: AxiosInstance;

  constructor(baseURL = `/${prefix}`) {
    this.axiosInstance = axios.create({
      baseURL,
    });
  }

  login(userAndPassword: UserAndPassword): Observable<AdminToken> {
    return from(
      this.axiosInstance
        .post(`/admin/${adminLogin}`, userAndPassword)
        .then(({ data }) => {
          const adminToken = validateDataFromSchema(adminTokenSchema, data);
          if (adminToken instanceof Error) throw adminToken;
          return adminToken;
        }),
    );
  }
}
