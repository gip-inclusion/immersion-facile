import { AbsoluteUrl } from "shared";
import { PeUserAndAdvisors } from "../dto/PeConnect.dto";

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => AbsoluteUrl;
  getUserAndAdvisors: (authorizationCode: string) => Promise<PeUserAndAdvisors>;
}
