export type InfrastructureErrorKinds =
  | AxiosInfrastructureError
  | ConnectionRefusedError
  | ConnectionResetError;

export type TCPWrapperErrorCodes = "ECONNREFUSED" | "ECONNRESET";
export type AxiosInfrastructureErrorCodes =
  (typeof axiosInfrastructureErrorCodes)[number];

const axiosInfrastructureErrorCodes = [
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL",
] as const;

export abstract class InfrastructureError extends Error {
  protected constructor(
    public override readonly message: string = "Infrastructure error",
    public override readonly cause: Error,
    public readonly code: TCPWrapperErrorCodes | AxiosInfrastructureErrorCodes,
  ) {
    super();
    // Error.captureStackTrace(this, this.constructor);
    this.name = "InfrastructureError";
    this.message = message;
  }
}

export class AxiosInfrastructureError extends InfrastructureError {
  constructor(
    public override readonly message: string = "Infrastructure error",
    public override readonly cause: Error,
    public override readonly code: AxiosInfrastructureErrorCodes,
  ) {
    super(message, cause, code);
    this.name = "AxiosInfrastructureError";
  }
}

export class ConnectionRefusedError extends InfrastructureError {
  constructor(
    public override readonly message: string = "Could not connect to server",
    public override readonly cause: Error,
  ) {
    super(message, cause, "ECONNREFUSED");
    this.name = "ConnectionRefusedError";
  }
}

export class ConnectionResetError extends InfrastructureError {
  constructor(
    public override readonly message: string = "The other side of the TCP conversation abruptly closed its end of the connection",
    public override readonly cause: Error,
  ) {
    super(message, cause, "ECONNRESET");
    this.name = "ConnectionResetError";
  }
}

export const isTCPWrapperConnectionRefusedError = (error: unknown): boolean =>
  (error as unknown as { code: string }).code === "ECONNREFUSED";

export const isTCPWrapperConnectionResetError = (error: unknown): boolean =>
  (error as unknown as { code: string }).code === "ECONNRESET";

export const isAxiosInfrastructureError = (error: unknown): boolean => {
  const axiosInfrastructureErrorCode: string | undefined = (
    error as unknown as { code: string }
  ).code;
  return (
    !!axiosInfrastructureErrorCode &&
    axiosInfrastructureErrorCodes.includes(
      axiosInfrastructureErrorCode as AxiosInfrastructureErrorCodes,
    )
  );
};
