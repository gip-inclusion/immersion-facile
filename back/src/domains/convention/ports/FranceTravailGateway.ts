import { isAxiosError } from "axios";
import type { SubscriberErrorFeedback } from "shared";
import type { AccessTokenResponse } from "../../../config/bootstrap/appConfig";
import type { BroadcastConventionParams } from "../use-cases/broadcast/broadcastConventionParams";

// This is an interface contract with France Travail (conventions broadcast).
// ! Beware of NOT breaking contract ! !
// Doc is here : https://pad.incubateur.net/6p38o0mNRfmc8WuJ77Xr0w?view

type FtBroadcastSuccessResponse = { status: 200 | 201 | 204; body: unknown };
type FtBroadcastErrorResponse = {
  status: Exclude<number, 200 | 201>;
  subscriberErrorFeedback: SubscriberErrorFeedback;
  body: unknown;
};

export type FranceTravailBroadcastResponse =
  | FtBroadcastSuccessResponse
  | FtBroadcastErrorResponse;

export const isBroadcastResponseOk = (
  response: FranceTravailBroadcastResponse,
): response is FtBroadcastSuccessResponse =>
  [200, 201, 204].includes(response.status);

export const isBroadcastTimeoutError = (
  response: FranceTravailBroadcastResponse,
): boolean => {
  if (isBroadcastResponseOk(response)) return false;
  const message = response.subscriberErrorFeedback.message.toLowerCase();
  if (message.includes("timeout")) return true;
  const error = response.subscriberErrorFeedback.error;

  if (
    isAxiosError(error) &&
    (error.code === "ECONNABORTED" || error.code === "ECONNRESET")
  )
    return true;
  return false;
};

export interface FranceTravailGateway {
  notifyOnConventionUpdated: (
    params: BroadcastConventionParams,
  ) => Promise<FranceTravailBroadcastResponse>;

  getAccessToken: (scope: string) => Promise<AccessTokenResponse>;
}
