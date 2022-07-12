import axios, { AxiosError } from "axios";
import { from, Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import { emailRoute } from "shared/src/routes";
import { EmailSentDto } from "shared/email";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";
import { validateDataFromSchema } from "shared/src/zodUtils";
import { emailsSentSchema } from "shared/email.schema";

const prefix = "api";

export class HttpSentEmailGateway implements SentEmailGateway {
  public getLatest(adminToken: AdminToken): Observable<EmailSentDto[]> {
    return from(
      axios
        .get<unknown>(`/${prefix}/admin/${emailRoute}`, {
          headers: {
            authorization: adminToken,
          },
        })
        .then(({ data }) => {
          const emailsSentDto = validateDataFromSchema(emailsSentSchema, data);
          if (emailsSentDto instanceof Error) throw emailsSentDto;
          return emailsSentDto;
        })
        .catch((error: AxiosError | Error) => {
          const message = axios.isAxiosError(error)
            ? error.response?.data?.errors
            : error.message;
          throw new Error(message);
        }),
    );
  }
}
