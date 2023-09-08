import { addSeconds } from "date-fns";
import isAfter from "date-fns/isAfter";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { RealTimeGateway } from "./TimeGateway/RealTimeGateway";

export class InMemoryCachingGateway<T> {
  readonly #cache: Partial<Record<string, Promise<CacheEntry<T>>>> = {};

  readonly #minimumCacheLifetime = 30;

  constructor(
    private readonly timeGateway: TimeGateway = new RealTimeGateway(),
    private responseExpireInSecondsProp: keyof T,
  ) {}

  public async caching(
    value: string,
    onCacheMiss: () => Promise<T>,
  ): Promise<T> {
    const cache = this.#cache[value];
    return cache === undefined || this.#isExpired(await cache)
      ? this.#onBadCache(value, onCacheMiss)
      : (await cache).response;
  }

  #isExpired(entry: CacheEntry<T>): boolean {
    return isAfter(this.timeGateway.now(), entry.expirationTime);
  }

  #onBadCache(value: string, onCacheMiss: () => Promise<T>): Promise<T> {
    this.#cache[value] = this.#refreshCache(onCacheMiss);
    return this.caching(value, onCacheMiss);
  }

  async #refreshCache(onCacheMiss: () => Promise<T>): Promise<CacheEntry<T>> {
    const response = await onCacheMiss();
    return {
      response,
      expirationTime: addSeconds(
        this.timeGateway.now(),
        Number(response[this.responseExpireInSecondsProp]) -
          this.#minimumCacheLifetime || 0,
      ),
    };
  }
}

type CacheEntry<T> = {
  response: T;
  expirationTime: Date;
};
