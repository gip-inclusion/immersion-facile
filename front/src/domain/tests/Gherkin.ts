export type Gherkin = "Given" | "And given" | "Then" | "And then";
export const isGiven = (gherkin: string) =>
  gherkin === "Given" || gherkin === "And given";
