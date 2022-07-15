import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { adminTokenSchema } from "shared/src/admin/admin.schema";
import { adminLogin } from "shared/src/routes";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public login(userAndPassword: UserAndPassword): Observable<AdminToken> {
    return from(
      this.httpClient.post<unknown>(`/admin/${adminLogin}`, userAndPassword),
    ).pipe(map(({ data }): AdminToken => adminTokenSchema.parse(data)));
  }
}
