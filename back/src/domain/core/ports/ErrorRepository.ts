export type SavedError = {
  serviceName: string;
  message: string;
  params: unknown;
  occurredAt: Date;
};

export interface ErrorRepository {
  save: (savedError: SavedError) => Promise<void>;
}
