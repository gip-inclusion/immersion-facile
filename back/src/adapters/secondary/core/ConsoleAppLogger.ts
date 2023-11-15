/* eslint-disable no-console */
import { AppLogger } from "../../../domain/core/ports/AppLogger";

export class ConsoleAppLogger implements AppLogger {
  public debug(...messages: unknown[]): void {
    console.debug(...messages);
  }

  public error(...messages: unknown[]): void {
    console.error(...messages);
  }

  public info(...messages: unknown[]): void {
    console.log(...messages);
  }

  public warn(...messages: unknown[]): void {
    console.warn(...messages);
  }
}
