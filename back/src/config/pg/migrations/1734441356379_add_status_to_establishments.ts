import { MigrationBuilder } from "node-pg-migrate";

export const up = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.createType("establishment_status", ["DEACTIVATED_FOR_LACK_OF_RESPONSES"]);

  pgm.addColumns("establishments", {
    status: {
      type: "establishment_status",
      notNull: false,
    },
    status_updated_at: {
      type: "timestamptz",
      notNull: false,
    },
  });
};

export const down = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.dropColumns("establishments", ["status", "status_updated_at"]);
  pgm.dropType("establishment_status");
};
