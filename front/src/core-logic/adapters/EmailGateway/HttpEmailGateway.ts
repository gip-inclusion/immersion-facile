import axios from "axios";
import { AdminToken } from "shared/src/admin/admin.dto";
import { emailRoute } from "shared/src/routes";
import { EmailSentDto } from "src/../../shared/email";
import { EmailGateway } from "src/core-logic/ports/EmailGateway";

const prefix = "api";

export class HttpEmailGateway implements EmailGateway {
  public async getLatest(adminToken: AdminToken): Promise<EmailSentDto[]> {
    const response = await axios.get(`/${prefix}/admin/${emailRoute}`, {
      headers: {
        authorization: adminToken,
      },
    });

    return response.data;
  }
}
