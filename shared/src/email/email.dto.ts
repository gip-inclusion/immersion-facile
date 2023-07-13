import { Flavor } from "../typeFlavors";

export type Email = Flavor<string, "Email">;

export type EmailAttachment =
  | { name: string; content: string }
  | { url: string };
