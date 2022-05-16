/* eslint-disable no-console */
import { AppLogger } from "../../../domain/core/ports/AppLogger";

export class ConsoleAppLogger implements AppLogger {
  debug(...messages: any[]): void {
    console.debug(...messages);
  }

  info(...messages: any[]): void {
    console.log(...messages);
  }

  error(...messages: any[]): void {
    console.error(...messages);
  }

  warn(...messages: any[]): void {
    console.warn(...messages);
  }
}
