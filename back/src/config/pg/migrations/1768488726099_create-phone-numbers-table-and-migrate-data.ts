import type { MigrationBuilder } from "node-pg-migrate";

const phoneNumbersTable = "phone_numbers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Step 1: Create the phone_numbers table
  pgm.createTable(phoneNumbersTable, {
    id: { type: "serial", primaryKey: true },
    phone_number: { type: "text", notNull: true },
    verified_at: { type: "timestamp", notNull: false },
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
    { table: "agencies", column: "phone_number_id" },
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
    INSERT INTO ${phoneNumbersTable} (phone_number, verified_at, created_at)
    SELECT DISTINCT potential_beneficiary_phone, NULL, NOW()
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
    INSERT INTO ${phoneNumbersTable} (phone_number, verified_at, created_at)
    SELECT DISTINCT phone_number, NULL, NOW()
    FROM agencies
    WHERE phone_number IS NOT NULL 
      AND phone_number != ''
      AND NOT EXISTS (
        SELECT 1 FROM ${phoneNumbersTable} 
        WHERE phone_number = agencies.phone_number
      );

    -- Update foreign keys in agencies
    UPDATE agencies a
    SET phone_number_id = pn.id
    FROM ${phoneNumbersTable} pn
    WHERE a.phone_number = pn.phone_number
      AND a.phone_number IS NOT NULL
      AND a.phone_number != '';
  `);

  // Step 5: Migrate data from actors table
  pgm.sql(`
    -- Insert unique phone numbers from actors
    INSERT INTO ${phoneNumbersTable} (phone_number, verified_at, created_at)
    SELECT DISTINCT phone, NULL, NOW()
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
    INSERT INTO ${phoneNumbersTable} (phone_number, verified_at, created_at)
    SELECT DISTINCT contact_phone, NULL, NOW()
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
    INSERT INTO ${phoneNumbersTable} (phone_number, verified_at, created_at)
    SELECT DISTINCT phone, NULL, NOW()
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
  pgm.createIndex("agencies", "phone_number_id");
  pgm.createIndex("actors", "phone_id");
  pgm.createIndex("api_consumers", "contact_phone_id");
  pgm.createIndex("establishments__users", "phone_id");

  // Step 9: Drop old phone columns (no longer needed)
  pgm.dropColumn("discussions", "potential_beneficiary_phone");
  pgm.dropColumn("agencies", "phone_number");
  pgm.dropColumn("actors", "phone");
  pgm.dropColumn("api_consumers", "contact_phone");
  pgm.dropColumn("establishments__users", "phone");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Step 1: Re-add old phone columns
  pgm.addColumn("discussions", {
    potential_beneficiary_phone: { type: "text", notNull: true, default: "" },
  });
  pgm.addColumn("agencies", {
    phone_number: { type: "text", notNull: true, default: "" },
  });
  pgm.addColumn("actors", {
    phone: { type: "text", notNull: true, default: "" },
  });
  pgm.addColumn("api_consumers", {
    contact_phone: { type: "text", notNull: true, default: "" },
  });
  pgm.addColumn("establishments__users", {
    phone: { type: "text", notNull: false },
  });

  // Step 2: Restore data from phone_numbers table to old columns
  pgm.sql(`
    UPDATE discussions d
    SET potential_beneficiary_phone = pn.phone_number
    FROM ${phoneNumbersTable} pn
    WHERE d.potential_beneficiary_phone_id = pn.id;

    UPDATE agencies a
    SET phone_number = pn.phone_number
    FROM ${phoneNumbersTable} pn
    WHERE a.phone_number_id = pn.id;

    UPDATE actors a
    SET phone = pn.phone_number
    FROM ${phoneNumbersTable} pn
    WHERE a.phone_id = pn.id;

    UPDATE api_consumers ac
    SET contact_phone = pn.phone_number
    FROM ${phoneNumbersTable} pn
    WHERE ac.contact_phone_id = pn.id;

    UPDATE establishments__users eu
    SET phone = pn.phone_number
    FROM ${phoneNumbersTable} pn
    WHERE eu.phone_id = pn.id;
  `);

  // Step 3: Drop indexes on foreign key columns
  pgm.dropIndex("establishments__users", "phone_id");
  pgm.dropIndex("api_consumers", "contact_phone_id");
  pgm.dropIndex("actors", "phone_id");
  pgm.dropIndex("agencies", "phone_number_id");
  pgm.dropIndex("discussions", "potential_beneficiary_phone_id");

  // Step 4: Drop foreign key columns from all tables
  pgm.dropColumn("establishments__users", "phone_id");
  pgm.dropColumn("api_consumers", "contact_phone_id");
  pgm.dropColumn("actors", "phone_id");
  pgm.dropColumn("agencies", "phone_number_id");
  pgm.dropColumn("discussions", "potential_beneficiary_phone_id");

  // Step 5: Drop the phone_numbers table
  pgm.dropTable(phoneNumbersTable);
}
