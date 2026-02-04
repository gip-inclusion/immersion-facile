import type { MigrationBuilder } from "node-pg-migrate";

const phoneNumbersTable = "phone_numbers";

const migrations: {
  table: string;
  sourceColumn: string;
  targetColumn: string;
  isNotNull: boolean;
}[] = [
  {
    table: "discussions",
    sourceColumn: "potential_beneficiary_phone",
    targetColumn: "potential_beneficiary_phone_id",
    isNotNull: true,
  },
  {
    table: "agencies",
    sourceColumn: "phone_number",
    targetColumn: "phone_id",
    isNotNull: true,
  },
  {
    table: "actors",
    sourceColumn: "phone",
    targetColumn: "phone_id",
    isNotNull: true,
  },
  {
    table: "api_consumers",
    sourceColumn: "contact_phone",
    targetColumn: "contact_phone_id",
    isNotNull: true,
  },
  {
    table: "establishments__users",
    sourceColumn: "phone",
    targetColumn: "phone_id",
    isNotNull: false,
  },
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Step 1: Create the phone_numbers table
  pgm.createTable(phoneNumbersTable, {
    id: { type: "serial", primaryKey: true },
    phone_number: { type: "text", notNull: true, unique: true },
    verified_at: { type: "timestamp", notNull: false, default: null },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  // Step 2: Add index on phone_number for fast lookups
  pgm.createIndex(phoneNumbersTable, "phone_number");

  // Step 3: Add foreign key columns to all tables
  for (const { table, targetColumn } of migrations) {
    pgm.addColumn(table, {
      [targetColumn]: {
        type: "integer",
        notNull: false,
        references: phoneNumbersTable,
        onDelete: "SET NULL",
      },
    });
  }

  // Step 4: Migrate data for all tables
  for (const { table, sourceColumn, targetColumn } of migrations) {
    pgm.sql(`
      -- Insert unique phone numbers from ${table}
      INSERT INTO ${phoneNumbersTable} (phone_number, created_at)
      SELECT DISTINCT ${sourceColumn}, NOW()
      FROM ${table}
      WHERE ${sourceColumn} IS NOT NULL 
        AND ${sourceColumn} != ''
        AND NOT EXISTS (
          SELECT 1 FROM ${phoneNumbersTable} 
          WHERE phone_number = ${table}.${sourceColumn}
        );

      -- Update foreign keys in ${table}
      UPDATE ${table} src
      SET ${targetColumn} = pn.id
      FROM ${phoneNumbersTable} pn
      WHERE src.${sourceColumn} = pn.phone_number
        AND src.${sourceColumn} IS NOT NULL
        AND src.${sourceColumn} != '';
    `);
  }

  // Step 5: Add NOT NULL constraint where needed
  for (const { table, targetColumn, isNotNull } of migrations) {
    if (isNotNull) {
      pgm.alterColumn(table, targetColumn, {
        notNull: true,
      });
    }
  }

  // Step 6: Add indexes on foreign key columns for performance
  for (const { table, targetColumn } of migrations) {
    pgm.createIndex(table, targetColumn);
  }

  // Step 7: Rename old phone columns
  for (const { table, sourceColumn } of migrations) {
    pgm.renameColumn(table, sourceColumn, `old__${sourceColumn}`);
  }

  // Step 8: Make old columns nullable
  for (const { table, sourceColumn } of migrations) {
    pgm.alterColumn(table, `old__${sourceColumn}`, {
      notNull: false,
    });
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Step 1: Rename old columns back first
  for (const { table, sourceColumn } of migrations) {
    pgm.renameColumn(table, `old__${sourceColumn}`, sourceColumn);
  }

  // Step 2: Restore data from phone_numbers table
  for (const { table, sourceColumn, targetColumn } of migrations) {
    pgm.sql(`
      UPDATE ${table} t
      SET ${sourceColumn} = pn.phone_number
      FROM ${phoneNumbersTable} pn
      WHERE t.${targetColumn} = pn.id;
    `);
  }

  // Step 3: Restore NOT NULL constraints
  for (const { table, sourceColumn, isNotNull } of migrations) {
    if (isNotNull) {
      pgm.alterColumn(table, sourceColumn, {
        notNull: true,
      });
    }
  }

  // Step 4: Drop indexes
  for (const { table, targetColumn } of migrations) {
    pgm.dropIndex(table, targetColumn);
  }

  // Step 5: Drop foreign key columns
  for (const { table, targetColumn } of migrations) {
    pgm.dropColumn(table, targetColumn);
  }

  // Step 6: Drop the phone_numbers table
  pgm.dropTable(phoneNumbersTable);
}
