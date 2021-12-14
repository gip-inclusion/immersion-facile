export type Position = { lat: number; lon: number };

export interface AdresseAPI {
  getPositionFromAddress: (address: string) => Promise<Position | undefined>;
  getCityCodeFromPosition: (position: Position) => Promise<number | undefined>;
}
