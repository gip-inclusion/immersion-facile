import { ConventionId } from "shared";

export type ConventionToSync = {
  id: ConventionId;
} & (
  | {
      status: "TO_PROCESS";
    }
  | {
      status: "SUCCESS";
      processDate: Date;
    }
  | {
      status: "ERROR";
      processDate: Date;
      reason: string;
    }
  | {
      status: "SKIP";
      processDate: Date;
      reason: string;
    }
);

export interface ConventionToSyncRepository {
  getById(id: ConventionId): Promise<ConventionToSync | undefined>;

  getNotProcessedAndErrored(limit: number): Promise<ConventionToSync[]>;

  save(filledConvention: ConventionToSync): Promise<void>;
}
