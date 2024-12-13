import { UnknownSharedRoute } from "shared-routes";
import { PartnerKey } from "../../../../config/bootstrap/partnerNames";

export type DefaultCacheConfig = {
  defaultCacheDurationInHours: number;
};

export type MakeWithCache<
  Config extends DefaultCacheConfig = DefaultCacheConfig,
> = (config: Config) => <Cb extends (...params: any[]) => Promise<any>>(args: {
  overrideCacheDurationInHours?: number;
  getCacheKey: (...params: Parameters<Cb>) => string;
  cb: Cb;
  logParams?: { route: UnknownSharedRoute; partner: PartnerKey };
}) => Cb;

export type WithCache = ReturnType<MakeWithCache>;
