import { AbsoluteUrl, SearchResultDto, WithAcquisition } from "shared";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";

export type GenericPair<K extends string, Payload> = {
  key: K;
  payload: Payload;
};

export type GenericStorage = GenericPair<string, unknown>;

export type LocalStoragePair =
  | GenericPair<"partialConventionInUrl", Partial<ConventionParamsInUrl>>
  | GenericPair<"adminToken", string>
  | GenericPair<"federatedIdentityWithUser", FederatedIdentityWithUser>
  | GenericPair<"searchResultExternal", SearchResultDto>;

export type SessionStoragePair =
  | GenericPair<"acquisitionParams", WithAcquisition>
  | GenericPair<"afterLoginRedirectionUrl", AbsoluteUrl>;

export type KeyInDevice<S extends GenericStorage> = S["key"];

type NarrowPair<K extends KeyInDevice<S>, S extends GenericStorage> = Extract<
  S,
  { key: K }
>;

export type DeviceRepository<S extends GenericStorage> = {
  set<K extends KeyInDevice<S>>(
    key: K,
    value: NarrowPair<K, S>["payload"],
  ): void;
  get<K extends KeyInDevice<S>>(
    key: K,
  ): NarrowPair<K, S>["payload"] | undefined;
  delete(key: KeyInDevice<S>): void;
};
