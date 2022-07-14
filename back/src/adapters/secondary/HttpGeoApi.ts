import { secondsToMilliseconds } from "date-fns";
import { RateLimiter } from "../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../domain/core/ports/RetryStrategy";
import {
  codeDepartmentToDepartmentName,
  codeRegionToRegionName,
  GeoApi,
  RegionAndDepartment,
} from "../../domain/generic/geo/ports/GeoApi";

import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../utils/axiosUtils";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export class HttpGeoApi implements GeoApi {
  public constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async getRegionAndDepartmentFromCodePostal(
    codePostal: string[5],
  ): Promise<RegionAndDepartment | undefined> {
    logger.debug({ codePostal }, "getPositionFromAddress");

    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(() =>
          axios.get("https://geo.api.gouv.fr/communes", {
            timeout: secondsToMilliseconds(10),
            params: {
              codePostal,
              limit: 1,
            },
          }),
        );

        const codeRegion = response?.data?.[0]?.codeRegion;
        const codeDepartement = response?.data?.[0]?.codeDepartement;

        if (!codeRegion || !codeDepartement) return;

        return {
          region: codeRegionToRegionName[codeRegion],
          department: codeDepartmentToDepartmentName[codeDepartement],
        };
      } catch (error: any) {
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        return;
      }
    });
  }
}
