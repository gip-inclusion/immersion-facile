import { MigrationBuilder } from "node-pg-migrate";

const oldTableName = "saved_errors";
const newTableName = "broadcast_feedbacks";

const oldParamsColumnName = "params";
const newParamsColumnName = "request_params";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable(oldTableName, newTableName);
  pgm.addColumn(newTableName, {
    response: { type: "jsonb", notNull: false },
  });
  pgm.renameColumn(newTableName, oldParamsColumnName, newParamsColumnName);
  pgm.alterColumn(newTableName, newParamsColumnName, { notNull: true });

  pgm.sql(`
    UPDATE ${newTableName}
    SET response = jsonb_set(
      COALESCE(response, '{}'),
      '{httpStatus}',
      ${newParamsColumnName}->'httpStatus'
    )
    WHERE ${newParamsColumnName} ? 'httpStatus';
    `);

  pgm.sql(`
    UPDATE ${newTableName}
    SET ${newParamsColumnName} = ${newParamsColumnName} - 'httpStatus'
    WHERE ${newParamsColumnName} ? 'httpStatus';
`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable(newTableName, oldTableName);
  pgm.renameColumn(oldTableName, newParamsColumnName, oldParamsColumnName);
  pgm.alterColumn(oldTableName, oldParamsColumnName, { notNull: false });

  pgm.sql(`
    UPDATE ${oldTableName}
    SET ${oldParamsColumnName} = jsonb_set(
      COALESCE(${oldParamsColumnName}, '{}'),
      '{httpStatus}',
      response->'httpStatus'
    )
    WHERE response ? 'httpStatus';
    `);

  pgm.dropColumn(oldTableName, "response");
}
