import { MigrationBuilder } from "node-pg-migrate";
import { DiscussionStatus, RejectionKind } from "shared";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("discussion_status", [
    "PENDING",
    "REJECTED",
  ] satisfies DiscussionStatus[]);
  pgm.createType("discussion_rejection_kind", [
    "UNABLE_TO_HELP",
    "NO_TIME",
    "OTHER",
  ] satisfies RejectionKind[]);
  pgm.addColumns("discussions", {
    status: { type: "discussion_status", default: "PENDING" },
    rejection_kind: { type: "discussion_rejection_kind", default: null },
    rejection_reason: { type: "text", default: null },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("discussions", [
    "status",
    "rejection_kind",
    "rejection_reason",
  ]);
  pgm.dropType("discussion_rejection_kind");
  pgm.dropType("discussion_status");
}
