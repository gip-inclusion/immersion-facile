import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { PeUserAndAdvisors } from "../dto/PeConnect.dto";

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => AbsoluteUrl;
  getUserAndAdvisors: (authorizationCode: string) => Promise<PeUserAndAdvisors>;
}
