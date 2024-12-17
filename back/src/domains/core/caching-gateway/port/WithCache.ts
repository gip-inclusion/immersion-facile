import { UnknownSharedRoute } from "shared-routes";
import { PartnerKey } from "../../../../config/bootstrap/partnerNames";

export type DefaultCacheConfig = {
  defaultCacheDurationInHours: number;
};

export type MakeWithCache<
  Config extends DefaultCacheConfig = DefaultCacheConfig,
> = (config: Config) => <
  T,
  Cb extends (param: T) => Promise<any> = (param: T) => Promise<any>,
>(args: {
  overrideCacheDurationInHours?: number;
  getCacheKey: (param: Parameters<Cb>[0]) => string;
  cb: Cb;
  logParams?: { route: UnknownSharedRoute; partner: PartnerKey };
}) => Cb;

export type WithCache = ReturnType<MakeWithCache>;
