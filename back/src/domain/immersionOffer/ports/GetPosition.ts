export type Position = { lat: number; lon: number };

export type GetPosition = (address: string) => Promise<Position | undefined>;
