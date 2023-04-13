import { addSeconds } from "date-fns";
import isAfter from "date-fns/isAfter";

import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";

import { RealTimeGateway } from "./TimeGateway/RealTimeGateway";

type Scope = string;
type CacheEntry = {
  response: GetAccessTokenResponse;
  expirationTime: Date;
};

// Minimum lifetime before a token is considered expired.
const minTtlSec = 30;

// An AccessTokenGateway that provides caching functionality and uses the injected
// AccessTokenGateway to delegate the fetching and refreshing of tokens.
//
// The class caches one token per scope so a single instance can be used to cache all tokens for a
// specific delegate gateway.
//
// Expired tokens are refreshed lazily.
export class CachingAccessTokenGateway implements AccessTokenGateway {
  private readonly cache: Record<Scope, Promise<CacheEntry>> = {};

  public constructor(
    private readonly delegate: AccessTokenGateway,
    private readonly timeGateway: TimeGateway = new RealTimeGateway(),
  ) {}

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    const cacheEntryPromise = this.cache[scope];
    if (!cacheEntryPromise || this.isExpired(await cacheEntryPromise)) {
      this.cache[scope] = this.refreshToken(scope);
    }

    const cacheEntry = await this.cache[scope];
    return cacheEntry.response;
  }

  private async refreshToken(scope: Scope): Promise<CacheEntry> {
    const response = await this.delegate.getAccessToken(scope);

    const expirationTime = addSeconds(
      this.timeGateway.now(),
      response.expires_in - minTtlSec || 0,
    );

    return {
      response,
      expirationTime,
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = this.timeGateway.now();
    return isAfter(now, entry.expirationTime);
  }
}
