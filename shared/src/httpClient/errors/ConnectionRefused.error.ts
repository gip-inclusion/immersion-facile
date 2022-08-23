export class ConnectionRefusedError extends Error {
  constructor(
    public override readonly message: string = "Could not connect to server",
    public override readonly cause?: Error,
  ) {
    super();
    // Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}

export const isConnectionRefusedError = (error: unknown): boolean =>
  (error as unknown as { code: string }).code === "ECONNREFUSED";
