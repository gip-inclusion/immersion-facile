import {
  isAxiosInfrastructureError,
  isTCPWrapperConnectionRefusedError,
  isTCPWrapperConnectionResetError,
} from "./AxiosInfrastructureError.error";

describe("AxiosInfrastructureError", () => {
  it.each([
    [{ code: "ECONNREFUSED" }, true],
    [{ code: "ECONNRESET" }, false],
    [{ code: "ERR_BAD_OPTION_VALUE" }, false],
    [{ code: "ERR_BAD_OPTION" }, false],
    [{ code: "ECONNABORTED" }, false],
    [{ code: "ETIMEDOUT" }, false],
    [{ code: "ERR_NETWORK" }, false],
    [{ code: "ERR_FR_TOO_MANY_REDIRECTS" }, false],
    [{ code: "ERR_DEPRECATED" }, false],
    [{ code: "ERR_BAD_RESPONSE" }, false],
    [{ code: "ERR_BAD_REQUEST" }, false],
    [{ code: "ERR_CANCELED" }, false],
    [{ code: "ERR_NOT_SUPPORT" }, false],
    [{ code: "ERR_INVALID_URL" }, false],
  ])(
    "Error is TCP Wrapper Connection Refused, expect: (%s to be %s)",
    (code: any, expected: boolean) => {
      expect(isTCPWrapperConnectionRefusedError(code)).toBe(expected);
    },
  );

  it.each([
    [{ code: "ECONNREFUSED" }, false],
    [{ code: "ECONNRESET" }, true],
    [{ code: "ERR_BAD_OPTION_VALUE" }, false],
    [{ code: "ERR_BAD_OPTION" }, false],
    [{ code: "ECONNABORTED" }, false],
    [{ code: "ETIMEDOUT" }, false],
    [{ code: "ERR_NETWORK" }, false],
    [{ code: "ERR_FR_TOO_MANY_REDIRECTS" }, false],
    [{ code: "ERR_DEPRECATED" }, false],
    [{ code: "ERR_BAD_RESPONSE" }, false],
    [{ code: "ERR_BAD_REQUEST" }, false],
    [{ code: "ERR_CANCELED" }, false],
    [{ code: "ERR_NOT_SUPPORT" }, false],
    [{ code: "ERR_INVALID_URL" }, false],
  ])(
    "Error is TCP Wrapper Connection reset, expect: (%s to be %s)",
    (error: any, expected: boolean) => {
      expect(isTCPWrapperConnectionResetError(error)).toBe(expected);
    },
  );

  it.each([
    [{ code: "ECONNREFUSED" }, false],
    [{ code: "ECONNRESET" }, false],
    [{ code: "ERR_BAD_OPTION_VALUE" }, true],
    [{ code: "ERR_BAD_OPTION" }, true],
    [{ code: "ECONNABORTED" }, true],
    [{ code: "ETIMEDOUT" }, true],
    [{ code: "ERR_NETWORK" }, true],
    [{ code: "ERR_FR_TOO_MANY_REDIRECTS" }, true],
    [{ code: "ERR_DEPRECATED" }, true],
    [{ code: "ERR_BAD_RESPONSE" }, true],
    [{ code: "ERR_BAD_REQUEST" }, true],
    [{ code: "ERR_CANCELED" }, true],
    [{ code: "ERR_NOT_SUPPORT" }, true],
    [{ code: "ERR_INVALID_URL" }, true],
  ])(
    "Error is Axios Infrastructure Error expect: (%s to be %s)",
    (code: any, expected: boolean) => {
      expect(isAxiosInfrastructureError(code)).toBe(expected);
    },
  );
});
