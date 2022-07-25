type InfrastructureErrorCodes = "ECONNREFUSED" | "ECONNRESET";

export class InfrastructureError extends Error {
  constructor(
    public override readonly message: string = "Infrastructure error",
    public override readonly cause: Error,
    public readonly code: InfrastructureErrorCodes,
  ) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}

export class ConnectionRefusedError extends InfrastructureError {
  constructor(
    public override readonly message: string = "Could not connect to server",
    public override readonly cause: Error,
  ) {
    super(message, cause, "ECONNREFUSED");
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}

// TODO On veut probablement réessayer l'appel quand ça arrive
export class ConnectionResetError extends InfrastructureError {
  constructor(
    public override readonly message: string = "The other side of the TCP conversation abruptly closed its end of the connection",
    public override readonly cause: Error,
  ) {
    super(message, cause, "ECONNRESET");
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}

export const isConnectionRefusedError = (error: unknown): boolean =>
  (error as unknown as { code: string }).code === "ECONNREFUSED";

export const isConnectionResetError = (error: unknown): boolean =>
  (error as unknown as { code: string }).code === "ECONNRESET";
