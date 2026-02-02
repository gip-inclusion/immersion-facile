import type { MigrationBuilder } from "node-pg-migrate";

const phoneNumbersTable = "phone_numbers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Step 1: Create the phone_numbers table
  pgm.createTable(phoneNumbersTable, {
    id: { type: "serial", primaryKey: true },
    phone_number: { type: "text", notNull: true },
    verified_at: { type: "timestamp", notNull: false, default: null },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  // Add index on phone_number for fast lookups
  pgm.createIndex(phoneNumbersTable, "phone_number");

  // Step 2: Add foreign key columns to all tables with phone numbers
  const tablesToMigrate = [
    { table: "discussions", column: "potential_beneficiary_phone_id" },
    { table: "agencies", column: "phone_id" },
    { table: "actors", column: "phone_id" },
    { table: "api_consumers", column: "contact_phone_id" },
    { table: "establishments__users", column: "phone_id" },
  ];

  for (const { table, column } of tablesToMigrate) {
    pgm.addColumn(table, {
      [column]: {
        type: "integer",
        notNull: false,
        references: phoneNumbersTable,
        onDelete: "SET NULL",
      },
    });
  }

  // Step 3: Migrate data from discussions table
  pgm.sql(`
    -- Insert unique phone numbers from discussions
    INSERT INTO ${phoneNumbersTable} (phone_number, created_at)
    SELECT DISTINCT potential_beneficiary_phone, NOW()
    FROM discussions
    WHERE potential_beneficiary_phone IS NOT NULL 
      AND potential_beneficiary_phone != ''
      AND NOT EXISTS (
        SELECT 1 FROM ${phoneNumbersTable} 
        WHERE phone_number = discussions.potential_beneficiary_phone
      );

    -- Update foreign keys in discussions
    UPDATE discussions d
    SET potential_beneficiary_phone_id = pn.id
    FROM ${phoneNumbersTable} pn
    WHERE d.potential_beneficiary_phone = pn.phone_number
      AND d.potential_beneficiary_phone IS NOT NULL
      AND d.potential_beneficiary_phone != '';
  `);

  // Step 4: Migrate data from agencies table
  pgm.sql(`
    -- Insert unique phone numbers from agencies
    INSERT INTO ${phoneNumbersTable} (phone_number, created_at)
    SELECT DISTINCT phone_number, NOW()
    FROM agencies
    WHERE phone_number IS NOT NULL 
      AND phone_number != ''
      AND NOT EXISTS (
        SELECT 1 FROM ${phoneNumbersTable} 
        WHERE phone_number = agencies.phone_number
      );

    -- Update foreign keys in agencies
    UPDATE agencies a
    SET phone_id = pn.id
    FROM ${phoneNumbersTable} pn
    WHERE a.phone_number = pn.phone_number
      AND a.phone_number IS NOT NULL
      AND a.phone_number != '';
  `);

  // Step 5: Migrate data from actors table
  pgm.sql(`
    -- Insert unique phone numbers from actors
    INSERT INTO ${phoneNumbersTable} (phone_number, created_at)
    SELECT DISTINCT phone, NOW()
    FROM actors
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND NOT EXISTS (
        SELECT 1 FROM ${phoneNumbersTable} 
        WHERE phone_number = actors.phone
      );

    -- Update foreign keys in actors
    UPDATE actors a
    SET phone_id = pn.id
    FROM ${phoneNumbersTable} pn
    WHERE a.phone = pn.phone_number
      AND a.phone IS NOT NULL
      AND a.phone != '';
  `);

  // Step 6: Migrate data from api_consumers table
  pgm.sql(`
    -- Insert unique phone numbers from api_consumers
    INSERT INTO ${phoneNumbersTable} (phone_number, created_at)
    SELECT DISTINCT contact_phone, NOW()
    FROM api_consumers
    WHERE contact_phone IS NOT NULL 
      AND contact_phone != ''
      AND NOT EXISTS (
        SELECT 1 FROM ${phoneNumbersTable} 
        WHERE phone_number = api_consumers.contact_phone
      );

    -- Update foreign keys in api_consumers
    UPDATE api_consumers ac
    SET contact_phone_id = pn.id
    FROM ${phoneNumbersTable} pn
    WHERE ac.contact_phone = pn.phone_number
      AND ac.contact_phone IS NOT NULL
      AND ac.contact_phone != '';
  `);

  // Step 7: Migrate data from establishments__users table
  pgm.sql(`
    -- Insert unique phone numbers from establishments__users
    INSERT INTO ${phoneNumbersTable} (phone_number, created_at)
    SELECT DISTINCT phone, NOW()
    FROM establishments__users
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND NOT EXISTS (
        SELECT 1 FROM ${phoneNumbersTable} 
        WHERE phone_number = establishments__users.phone
      );

    -- Update foreign keys in establishments__users
    UPDATE establishments__users eu
    SET phone_id = pn.id
    FROM ${phoneNumbersTable} pn
    WHERE eu.phone = pn.phone_number
      AND eu.phone IS NOT NULL
      AND eu.phone != '';
  `);

  // Step 8: Add indexes on foreign key columns for performance
  pgm.createIndex("discussions", "potential_beneficiary_phone_id");
  pgm.createIndex("agencies", "phone_id");
  pgm.createIndex("actors", "phone_id");
  pgm.createIndex("api_consumers", "contact_phone_id");
  pgm.createIndex("establishments__users", "phone_id");

  // Step 9: Drop old phone columns (no longer needed)
  pgm.renameColumn(
    "discussions",
    "potential_beneficiary_phone",
    "old__potential_beneficiary_phone",
  );
  pgm.renameColumn("agencies", "phone_number", "old__phone_number");
  pgm.renameColumn("actors", "phone", "old__phone");
  pgm.renameColumn("api_consumers", "contact_phone", "old__contact_phone");
  pgm.renameColumn("establishments__users", "phone", "old__phone");

  // Step 10: Make old columns nullable

  pgm.alterColumn("discussions", "old__potential_beneficiary_phone", {
    notNull: false,
  });
  pgm.alterColumn("agencies", "old__phone_number", {
    notNull: false,
  });
  pgm.alterColumn("actors", "old__phone", {
    notNull: false,
  });
  pgm.alterColumn("api_consumers", "old__contact_phone", {
    notNull: false,
  });
  pgm.alterColumn("establishments__users", "old__phone", {
    notNull: false,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Step 3: Drop indexes on foreign key columns
  pgm.dropIndex("establishments__users", "phone_id");
  pgm.dropIndex("api_consumers", "contact_phone_id");
  pgm.dropIndex("actors", "phone_id");
  pgm.dropIndex("agencies", "phone_id");
  pgm.dropIndex("discussions", "potential_beneficiary_phone_id");

  // Step 4: Drop foreign key columns from all tables
  pgm.dropColumn("establishments__users", "phone_id");
  pgm.dropColumn("api_consumers", "contact_phone_id");
  pgm.dropColumn("actors", "phone_id");
  pgm.dropColumn("agencies", "phone_id");
  pgm.dropColumn("discussions", "potential_beneficiary_phone_id");

  // Step 5: Rename old phone number column
  pgm.renameColumn(
    "discussions",
    "old__potential_beneficiary_phone",
    "potential_beneficiary_phone",
  );
  pgm.renameColumn("agencies", "old__phone_number", "phone_number");
  pgm.renameColumn("actors", "old__phone", "phone");
  pgm.renameColumn("api_consumers", "old__contact_phone", "contact_phone");
  pgm.renameColumn("establishments__users", "old__phone", "phone");

  // Step 6: Reset not null to true
  pgm.alterColumn("discussions", "potential_beneficiary_phone", {
    notNull: true,
  });
  pgm.alterColumn("agencies", "phone_number", {
    notNull: true,
  });
  pgm.alterColumn("actors", "phone", {
    notNull: true,
  });
  pgm.alterColumn("api_consumers", "contact_phone", {
    notNull: true,
  });
  pgm.alterColumn("establishments__users", "phone", {
    notNull: true,
  });

  // Step 7: Drop the phone_numbers table
  pgm.dropTable(phoneNumbersTable);
}
