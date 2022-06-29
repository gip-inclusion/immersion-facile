import axios, { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { adminLogin } from "shared/src/routes";
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
        .then((response) => response.data),
    );
  }
}
