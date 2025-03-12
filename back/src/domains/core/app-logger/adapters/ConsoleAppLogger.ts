import type { AppLogger } from "../ports/AppLogger";

export class ConsoleAppLogger implements AppLogger {
  public debug(...messages: unknown[]): void {
    console.debug(...messages);
  }

  public error(...messages: unknown[]): void {
    console.error(...messages);
  }

  public info(...messages: unknown[]): void {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(...messages);
  }

  public warn(...messages: unknown[]): void {
    console.warn(...messages);
  }
}
