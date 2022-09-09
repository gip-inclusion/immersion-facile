import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ConventionPresentation } from "src/app/pages/Convention/ConventionPage";

type GenericPair<K extends string, Payload> = {
  key: K;
  payload: Payload;
};

type StoredPair =
  | GenericPair<"partialConvention", Partial<ConventionPresentation>>
  | GenericPair<"adminToken", string>
  | GenericPair<"federatedIdentity", FederatedIdentity>;

export type KeyInDevice = StoredPair["key"];

type NarrowPair<
  K extends KeyInDevice,
  P extends StoredPair = StoredPair,
> = Extract<P, { key: K }>;

export interface DeviceRepository {
  set<K extends KeyInDevice>(key: K, value: NarrowPair<K>["payload"]): void;
  get<K extends KeyInDevice>(key: K): NarrowPair<K>["payload"] | undefined;
  delete(key: KeyInDevice): void;
}
