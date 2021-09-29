import { addSeconds } from "date-fns";
import isAfter from "date-fns/isAfter";
import parseISO from "date-fns/parseISO";
import {
  AccessTokenGateway,
  GetAccessTokenResponse
} from "../../../domain/core/ports/AccessTokenGateway";
import { Clock } from "../../../domain/core/ports/Clock";
import { logger } from "../../../utils/logger";
import { RealClock } from "./ClockImplementations";

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
  private readonly logger = logger.child({
    logsource: "CachingAccessTokenGateway",
  });
  private readonly cache: Record<Scope, CacheEntry> = {};

  public constructor(
    private readonly delegate: AccessTokenGateway,
    private readonly clock: Clock = new RealClock(),
  ) {}

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    const cacheEntry = this.cache[scope];
    if (cacheEntry && !this.isExpired(cacheEntry)) return cacheEntry.response;

    const response = await this.delegate.getAccessToken(scope);

    const expirationTime = addSeconds(
      parseISO(this.clock.now()),
      response.expires_in - minTtlSec || 0,
    );
    this.cache[scope] = {
      response,
      expirationTime,
    };
    this.logger.debug({ response, expirationTime }, "caching entry");

    return response;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = new Date(this.clock.now());
    return isAfter(now, entry.expirationTime);
  }
}
