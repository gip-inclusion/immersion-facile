export type DefaultCacheConfig = {
  defaultCacheDurationInHours: number;
};

export type MakeWithCache<
  Config extends DefaultCacheConfig = DefaultCacheConfig,
> = (config: Config) => <Cb extends (...params: any[]) => Promise<any>>(args: {
  overrideCacheDurationInHours?: number;
  getCacheKey: (...params: Parameters<Cb>) => string;
  cb: Cb;
}) => Cb;

export type WithCache = ReturnType<MakeWithCache>;
