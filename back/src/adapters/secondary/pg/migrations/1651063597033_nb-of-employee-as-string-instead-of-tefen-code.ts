/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishments", "number_employees", {
    type: "varchar(255)",
    using: "number_employees::text",
  });
  await pgm.sql(`
  UPDATE establishments 
  SET number_employees = CASE
     WHEN number_employees='0' THEN '0' 
     WHEN number_employees='1' THEN '1-2' 
     WHEN number_employees='2' THEN '3-5' 
     WHEN number_employees='3' THEN '6-9' 
     WHEN number_employees='11' THEN '10-19' 
     WHEN number_employees='12' THEN '20-49' 
     WHEN number_employees='21' THEN '50-99' 
     WHEN number_employees='22' THEN '100-199' 
     WHEN number_employees='31' THEN '200-249' 
     WHEN number_employees='32' THEN '250-499' 
     WHEN number_employees='41' THEN '500-999' 
     WHEN number_employees='42' THEN '1000-1999' 
     WHEN number_employees='51' THEN '2000-4999' 
     WHEN number_employees='52' THEN '5000-9999' 
     WHEN number_employees='53' THEN '+10000' 
     ELSE ''
     END 
     `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`
    UPDATE establishments 
    SET number_employees = CASE
        WHEN number_employees='0' THEN '0' 
        WHEN number_employees='1-2' THEN '1' 
        WHEN number_employees='3-5' THEN '2' 
        WHEN number_employees='6-9' THEN '3' 
        WHEN number_employees='10-19' THEN '11' 
        WHEN number_employees='20-49' THEN '12' 
        WHEN number_employees='50-99' THEN '21' 
        WHEN number_employees='100-199' THEN '22' 
        WHEN number_employees='200-249' THEN '31' 
        WHEN number_employees='250-499' THEN '32' 
        WHEN number_employees='500-999' THEN '41' 
        WHEN number_employees='1000-1999' THEN '42' 
        WHEN number_employees='2000-4999' THEN '51' 
        WHEN number_employees='5000-9999' THEN '52' 
        WHEN number_employees='+10000' THEN '53' 
        ELSE '-1'
        END
    `);

  pgm.alterColumn("establishments", "number_employees", {
    type: "integer",
    using: "number_employees::int",
  });
}
