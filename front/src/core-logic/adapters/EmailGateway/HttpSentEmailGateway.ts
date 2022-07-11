import axios from "axios";
import { from, Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import { emailRoute } from "shared/src/routes";
import { EmailSentDto } from "src/../../shared/email";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";

const prefix = "api";

export class HttpSentEmailGateway implements SentEmailGateway {
  public getLatest(adminToken: AdminToken): Observable<EmailSentDto[]> {
    return from(
      axios
        .get(`/${prefix}/admin/${emailRoute}`, {
          headers: {
            authorization: adminToken,
          },
        })
        .then((response) => response.data),
    );
  }
}
