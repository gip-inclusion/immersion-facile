import { Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
}
