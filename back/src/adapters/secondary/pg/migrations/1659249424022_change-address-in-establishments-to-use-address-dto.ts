import { MigrationBuilder } from "node-pg-migrate";
import format from "pg-format";
import { keys, trim } from "ramda";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.renameColumn("establishments", "address", "legacy_address");
  await pgm.alterColumn("establishments", "legacy_address", { notNull: false });
  await pgm.addColumns("establishments", {
    street_number_and_address: { type: "text", notNull: true, default: "" },
    post_code: { type: "text", notNull: true, default: "" },
    city: { type: "text", notNull: true, default: "" },
    department_code: { type: "text", notNull: true, default: "" },
  });

  await pgm.alterColumn("establishments", "street_number_and_address", {
    default: null,
  });
  await pgm.alterColumn("establishments", "post_code", { default: null });
  await pgm.alterColumn("establishments", "department_code", { default: null });
  await pgm.alterColumn("establishments", "city", { default: null });

  // Migrate content
  const establishments_siret_adress = await pgm.db.select(
    "SELECT siret, address FROM establishments",
  );

  if (establishments_siret_adress.length === 0) return;
  const establishmentsAddressDtos = establishments_siret_adress.map(
    ({ siret, address }) => {
      const dto = addressStringToDto(address);
      return [
        siret,
        dto.streetNumberAndAddress,
        dto.postcode,
        dto.city,
        dto.departmentCode,
      ];
    },
  );

  const query = format(
    `
    UPDATE establishments AS e SET
      street_number_and_address = c.street_number_and_address,
      post_code = c.post_code,
      department_code = c.department_code,
      city = c.city
    FROM (VALUES %L) 
    AS c(siret, street_number_and_address, post_code, city, department_code)
    WHERE trim(c.siret) = trim(e.siret);
    `,
    establishmentsAddressDtos,
  );

  await pgm.sql(query);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("establishments", "legacy_address", "address");
  pgm.alterColumn("establishments", "address", { notNull: true });
  pgm.dropColumns("establishments", [
    "street_number_and_address",
    "post_code",
    "department_code",
    "city",
  ]);
}
export const captureAddressGroups = (fullAddressString: string) => {
  const captureAddressGroupsRegex =
    /(?<address>^.*)(?<postalCode>[0-9]{5}) (?<city>.+$)/u;
  const capture = captureAddressGroupsRegex.exec(fullAddressString);
  const address = capture?.groups?.["address"];
  const postalCode = capture?.groups?.["postalCode"];
  const city = capture?.groups?.["city"];

  return {
    address: trim(address ?? "").replace(/,(?=[^,]*$)/, ""),
    postalCode: trim(postalCode ?? ""),
    city: trim(city ?? ""),
    validAddress: address != null && postalCode != null && city != null,
  };
};

const DEPARTMENT_CODES_FROM_3_CHARS: Record<string, string> = {
  "971": "971",
  "972": "972",
  "973": "973",
  "974": "974",
  "975": "975",
  "976": "976",
  "200": "2A",
  "201": "2A",
  "202": "2B",
  "206": "2B",
};

export const inferDepartmentCode = (postcode: string): string => {
  if (keys(DEPARTMENT_CODES_FROM_3_CHARS).includes(postcode.slice(0, 3))) {
    return DEPARTMENT_CODES_FROM_3_CHARS[postcode.slice(0, 3)];
  }
  return postcode.slice(0, 2);
};

export const addressStringToDto = (address: string) => {
  const addressGroups = captureAddressGroups(address);
  return {
    streetNumberAndAddress: addressGroups.address,
    city: addressGroups.city,
    departmentCode: inferDepartmentCode(addressGroups.postalCode),
    postcode: addressGroups.postalCode,
  };
};
