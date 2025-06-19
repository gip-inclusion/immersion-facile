import type { UnknownSharedRoute } from "shared-routes";
import type { PartnerKey } from "../../../../config/bootstrap/partnerNames";

export type DefaultCacheConfig = {
  defaultCacheDurationInHours: number;
};

export type MakeWithCache<
  Config extends DefaultCacheConfig = DefaultCacheConfig,
> = (
  config: Config,
) => <R, T = string>(args: {
  overrideCacheDurationInHours?: number;
  getCacheKey: (param: T) => string;
  cb: (param: T) => Promise<R>;
  logParams?: { route: UnknownSharedRoute; partner: PartnerKey };
}) => (param: T) => Promise<R>;

export type WithCache = ReturnType<MakeWithCache>;
