import { ConventionPresentation } from "src/app/pages/Convention/ConventionPage";

type GenericPair<K extends string, Payload> = {
  key: K;
  payload: Payload;
};

type StoredPair = GenericPair<
  "partialConvention",
  Partial<ConventionPresentation>
>;
// new cases could be added with a union like this :
// | GenericPair<"yourKey", YourPayloadType>;

type Keys = StoredPair["key"];

export type NarrowPair<
  K extends Keys,
  P extends StoredPair = StoredPair,
> = Extract<P, { key: K }>;

export interface DeviceRepository {
  set<K extends Keys>(key: K, value: NarrowPair<K>["payload"]): void;
  get<K extends Keys>(key: K): NarrowPair<K>["payload"] | undefined;
  delete(key: Keys): void;
}
