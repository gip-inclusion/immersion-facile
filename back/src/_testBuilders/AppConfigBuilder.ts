import { AppConfig } from "../adapters/primary/appConfig";
import { ProcessEnv } from "../shared/envHelpers";
import { Builder } from "./Builder";

const defaultConfigParams = {
  NODE_ENV: "test",
  LA_BONNE_BOITE_GATEWAY: "IN_MEMORY",

  // Test-only keys, do not use in production environments!
  JWT_PRIVATE_KEY:
    "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIEUlP92zWRVJTz5bxyP57npwsPCi0lh5C/uxX5ZuJn6OoAoGCCqGSM49\nAwEHoUQDQgAEF0O2Llia9pN283L4DYrVUgIQrqPduq+gkqPLDn9OoVYcbRdeKqCe\n53195KiTm0aSOw/mgml9SVt+Rs4t60Ubkw==\n-----END EC PRIVATE KEY-----",
  JWT_PUBLIC_KEY:
    "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEF0O2Llia9pN283L4DYrVUgIQrqPd\nuq+gkqPLDn9OoVYcbRdeKqCe53195KiTm0aSOw/mgml9SVt+Rs4t60Ubkw==\n-----END PUBLIC KEY-----",
  API_JWT_PRIVATE_KEY:
    "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIEUlP92zWRVJTz5bxyP57npwsPCi0lh5C/uxX5ZuJn6OoAoGCCqGSM49\nAwEHoUQDQgAEF0O2Llia9pN283L4DYrVUgIQrqPduq+gkqPLDn9OoVYcbRdeKqCe\n53195KiTm0aSOw/mgml9SVt+Rs4t60Ubkw==\n-----END EC PRIVATE KEY-----",
  API_JWT_PUBLIC_KEY:
    "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEF0O2Llia9pN283L4DYrVUgIQrqPd\nuq+gkqPLDn9OoVYcbRdeKqCe53195KiTm0aSOw/mgml9SVt+Rs4t60Ubkw==\n-----END PUBLIC KEY-----",

  BACKOFFICE_USERNAME: "e2e_tests",
  BACKOFFICE_PASSWORD: "e2e",
};

// See "Working with AppConfig" in back/README.md for more details.
export class AppConfigBuilder implements Builder<AppConfig> {
  private readonly configParams: ProcessEnv;

  public constructor(configParams: ProcessEnv = {}) {
    this.configParams = { ...defaultConfigParams, ...configParams };
  }

  public withConfigParams(configParams: ProcessEnv) {
    return new AppConfigBuilder({
      ...this.configParams,
      ...configParams,
    });
  }

  public withRepositories(REPOSITORIES: string) {
    return new AppConfigBuilder({
      ...this.configParams,
      REPOSITORIES,
    });
  }

  public withPgUrl(PG_URL: string) {
    return new AppConfigBuilder({
      ...this.configParams,
      PG_URL,
    });
  }

  public withAuthorizedApiKeyIds(authorizedApiKeyIds: string[]) {
    return new AppConfigBuilder({
      ...this.configParams,
      AUTHORIZED_API_KEY_IDS: authorizedApiKeyIds.join(","),
    });
  }

  public withTestPresetPreviousKeys() {
    return new AppConfigBuilder({
      ...this.configParams,
      JWT_PREVIOUS_PUBLIC_KEY:
        "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXM1fwl4kRy3ivmtJt2CdLTDx/HgS\nOeLqLQ+q+pqjLnsCJaQtiiy7kceujtxAhZcJBSh0QFBoq8JsuaZxNrrBpg==\n-----END PUBLIC KEY-----",

      JWT_PREVIOUS_PRIVATE_KEY:
        "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIOgvkzcTPgVdse0fey6Lix4M6mywCpuWbdjFVj23OA2YoAoGCCqGSM49\nAwEHoUQDQgAEXM1fwl4kRy3ivmtJt2CdLTDx/HgSOeLqLQ+q+pqjLnsCJaQtiiy7\nkceujtxAhZcJBSh0QFBoq8JsuaZxNrrBpg==\n-----END EC PRIVATE KEY-----",
    });
  }

  public build() {
    return AppConfig.createFromEnv(/* readDotEnv= */ false, this.configParams);
  }
}
