export type SavedError = {
  serviceName: string;
  httpStatus: number;
  message: string;
  params: unknown;
  occurredAt: Date;
};

export interface ErrorRepository {
  save: (savedError: SavedError) => void;
}
