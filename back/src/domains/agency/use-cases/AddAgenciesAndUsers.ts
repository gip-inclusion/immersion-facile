import { flatten, splitEvery, uniq, values } from "ramda";
import {
  type AgencyWithUsersRights,
  errors,
  type GeoPositionDto,
  geoPositionSchema,
  type PhoneNumber,
  phoneNumberSchema,
} from "shared";
import { z } from "zod";
import { getUserByEmailAndCreateIfMissing } from "../../connected-users/helpers/connectedUser.helper";
import type { UserRepository } from "../../core/authentication/connected-user/port/UserRepository";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { AgencyRepository } from "../ports/AgencyRepository";

export type ImportedAgencyAndUserRow = {
  ID: string;
  SIRET: string;
  "Type structure": string;
  "Nom structure": string;
  "E-mail authentification": string;
  "Adresse ligne 1": string;
  "Adresse ligne 2": string;
  Ville: string;
  "Code postal": string;
  Coordonées: GeoPositionDto;
  Téléphone: PhoneNumber;
};

export const importedAgencyAndUserRowSchema: z.Schema<ImportedAgencyAndUserRow> =
  z.object({
    ID: z.string(),
    SIRET: z.string(),
    "Type structure": z.string(),
    "Nom structure": z.string(),
    "E-mail authentification": z.string(),
    "Adresse ligne 1": z.string(),
    "Adresse ligne 2": z.string(),
    Ville: z.string(),
    Coordonées: z.preprocess((val) => {
      if (typeof val === "string") {
        const [lat, lon] = val.replace("(", "").replace(")", "").split(", ");
        return {
          lat: Number.parseFloat(lat),
          lon: Number.parseFloat(lon),
        } as GeoPositionDto;
      }
      return val;
    }, geoPositionSchema) as z.ZodType<GeoPositionDto>,
    "Code postal": z.string(),
    Téléphone: phoneNumberSchema,
  });

export type AddAgenciesAndUsers = ReturnType<typeof makeAddAgenciesAndUsers>;
export const makeAddAgenciesAndUsers = useCaseBuilder("AddAgenciesAndUsers")
  .withInput<ImportedAgencyAndUserRow[]>(
    z.array(importedAgencyAndUserRowSchema),
  )
  .withOutput<{
    siretAlreadyInIFCount: number;
    createdAgenciesCount: number;
    createdUsersCount: number;
    usersAlreadyInIFCount: number;
  }>()
  .withDeps<{
    uuidGenerator: UuidGenerator;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const chunkSize = 100;
    const chunks = splitEvery(chunkSize, inputParams);
    const formattedImportedAgencies =
      formatImportedAgencyAndUserRow(inputParams);
    const existingAgencies = flatten(
      await Promise.all(
        chunks.map(async (importedAgencies) => {
          return await uow.agencyRepository.getAgencies({
            filters: {
              sirets: importedAgencies.map(
                (importedAgency) => importedAgency.SIRET,
              ),
            },
          });
        }),
      ),
    );

    const siretsInIF = uniq(
      existingAgencies.map((agency) => agency.agencySiret),
    );
    const rowsNotInIF = formattedImportedAgencies.filter(
      (importedAgency) => !siretsInIF.includes(importedAgency.SIRET),
    );
    const { rowsWithDuplicates, uniqRows } =
      findDuplicatesInImportedRows(rowsNotInIF);

    const { createdUsersCount, usersAlreadyInIFCount } =
      await createOrUpdateUsers({
        emails: formattedImportedAgencies.map(
          (importedAgency) => importedAgency["E-mail authentification"],
        ),
        userRepository: uow.userRepository,
        timeGateway: deps.timeGateway,
        uuidGenerator: deps.uuidGenerator,
      });

    await addOrUpdateAgencyUsers({
      agenciesIF: existingAgencies,
      importedAgencyAndUserRows: formattedImportedAgencies,
      agencyRepository: uow.agencyRepository,
      userRepository: uow.userRepository,
    });

    await createNewAgencies({
      importedAgencyAndUserRows: rowsWithDuplicates,
      agencyRepository: uow.agencyRepository,
      userRepository: uow.userRepository,
      deps,
    });

    await createNewAgenciesWithSuffix({
      allRows: formattedImportedAgencies,
      rowsToCreateAsAgencies: uniqRows,
      agencyRepository: uow.agencyRepository,
      userRepository: uow.userRepository,
      deps,
    });

    return {
      siretAlreadyInIFCount: siretsInIF.length,
      createdAgenciesCount: rowsWithDuplicates.length + uniqRows.length,
      createdUsersCount,
      usersAlreadyInIFCount,
    };
  });

const addOrUpdateAgencyUsers = async ({
  agenciesIF,
  importedAgencyAndUserRows,
  agencyRepository,
  userRepository,
}: {
  agenciesIF: AgencyWithUsersRights[];
  importedAgencyAndUserRows: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
}): Promise<void> => {
  const siretsInIF = agenciesIF.map((agency) => agency.agencySiret);
  const rowsWithSiretAlreadyInIF = importedAgencyAndUserRows.filter((row) =>
    siretsInIF.includes(row.SIRET),
  );

  await Promise.all(
    rowsWithSiretAlreadyInIF.map(async (row) => {
      const agencyIF = agenciesIF.find(
        (agencyIF) => agencyIF.agencySiret === row.SIRET,
      );
      if (!agencyIF)
        throw new Error(
          `Should not happen: Agency ${row.SIRET} not found in IF`,
        );

      const user = await userRepository.findByEmail(
        row["E-mail authentification"],
      );
      if (!user)
        throw errors.user.notFoundByEmail({
          email: row["E-mail authentification"],
        });

      const userWithRoles = agencyIF.usersRights[user.id] ?? undefined;

      if (
        !userWithRoles ||
        !userWithRoles.roles.includes("agency-admin") ||
        !userWithRoles.roles.includes("validator")
      ) {
        await agencyRepository.update({
          id: agencyIF.id,
          usersRights: {
            ...agencyIF.usersRights,
            [user.id]: {
              roles: uniq([
                ...(userWithRoles ? userWithRoles.roles : []),
                "agency-admin",
                "validator",
              ]),
              isNotifiedByEmail: userWithRoles?.isNotifiedByEmail ?? true,
            },
          },
        });
      }
    }),
  );
};

const formatImportedAgencyAndUserRow = (
  importedAgencyAndUserRow: ImportedAgencyAndUserRow[],
) => {
  const removeSpaces = (str: string) => str.replace(/\s/g, "");
  const capitalizeFirstLetter = (str: string) =>
    str
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return importedAgencyAndUserRow.map((row) => ({
    ...row,
    "Type structure": row["Type structure"].toUpperCase(),
    "Nom structure": capitalizeFirstLetter(row["Nom structure"]),
    "E-mail authentification": row["E-mail authentification"].toLowerCase(),
    "Adresse ligne 1": row["Adresse ligne 1"].toLowerCase(),
    "Adresse ligne 2": row["Adresse ligne 2"].toLowerCase(),
    Ville: capitalizeFirstLetter(row.Ville),
    Téléphone: removeSpaces(row.Téléphone),
  }));
};

const createNewAgencies = async ({
  importedAgencyAndUserRows,
  agencyRepository,
  userRepository,
  deps,
}: {
  importedAgencyAndUserRows: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
  deps: { uuidGenerator: UuidGenerator; timeGateway: TimeGateway };
}) => {
  await Promise.all(
    await importedAgencyAndUserRows.map(async (row) => {
      const user = await userRepository.findByEmail(
        row["E-mail authentification"],
      );
      if (!user)
        throw errors.user.notFoundByEmail({
          email: row["E-mail authentification"],
        });

      const agencyDepartmentCode = row["Code postal"].slice(0, 2);
      const agency: AgencyWithUsersRights = {
        id: deps.uuidGenerator.new(),
        status: "active",
        agencySiret: row.SIRET,
        name: row["Nom structure"],
        address: {
          streetNumberAndAddress: row["Adresse ligne 1"],
          postcode: row["Code postal"],
          city: row.Ville,
          departmentCode: agencyDepartmentCode,
        },
        position: {
          lat: row.Coordonées.lat,
          lon: row.Coordonées.lon,
        },
        kind: "structure-IAE",
        coveredDepartments: [agencyDepartmentCode],
        logoUrl: null,
        signature: "L'équipe",
        refersToAgencyId: null,
        refersToAgencyName: null,
        phoneNumber: row.Téléphone,
        usersRights: {
          [user.id]: {
            roles: ["agency-admin", "validator"],
            isNotifiedByEmail: true,
          },
        },
        codeSafir: null,
        rejectionJustification: null,
      };

      await agencyRepository.insert(agency);
    }),
  );
};

// duplicas si même siret + nom structure + e-mail authentification + adresse ligne 1 + code postal + ville + téléphone
function findDuplicatesInImportedRows(
  rows: ImportedAgencyAndUserRow[],
): Record<string, ImportedAgencyAndUserRow[]> {
  const groupedRows = rows.reduce(
    (acc, row) => {
      const key = [
        row.SIRET,
        row["Nom structure"],
        row["E-mail authentification"],
        row["Adresse ligne 1"],
        row["Code postal"],
        row.Ville,
        row.Téléphone,
      ].join("||");

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);

      return acc;
    },
    {} as Record<string, ImportedAgencyAndUserRow[]>,
  );

  return values(groupedRows).reduce(
    (acc, curr) => {
      if (curr.length > 1) {
        acc.rowsWithDuplicates.push(curr[0]);
      } else {
        acc.uniqRows.push(curr[0]);
      }
      return acc;
    },
    {
      rowsWithDuplicates: [] as ImportedAgencyAndUserRow[],
      uniqRows: [] as ImportedAgencyAndUserRow[],
    },
  );
}

const createOrUpdateUsers = async ({
  emails,
  userRepository,
  timeGateway,
  uuidGenerator,
}: {
  emails: string[];
  userRepository: UserRepository;
  timeGateway: TimeGateway;
  uuidGenerator: UuidGenerator;
}) => {
  const uniqEmails = uniq(emails);

  const newUsersCount = (
    await Promise.all(
      uniqEmails.map(async (email) => {
        const newUserUUid = uuidGenerator.new();
        const user = await getUserByEmailAndCreateIfMissing({
          userRepository,
          timeGateway: timeGateway,
          userIdIfNew: newUserUUid,
          userEmail: email,
        });

        return user.id === newUserUUid;
      }),
    )
  ).filter(Boolean).length;

  return {
    createdUsersCount: newUsersCount,
    usersAlreadyInIFCount: uniqEmails.length - newUsersCount,
  };
};

const createNewAgenciesWithSuffix = async ({
  allRows,
  rowsToCreateAsAgencies,
  agencyRepository,
  userRepository,
  deps,
}: {
  allRows: ImportedAgencyAndUserRow[];
  rowsToCreateAsAgencies: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
  deps: { uuidGenerator: UuidGenerator; timeGateway: TimeGateway };
}) => {
  const rowsGroupedBySiret = allRows.reduce(
    (acc, row) => {
      if (!acc[row.SIRET]) {
        acc[row.SIRET] = [];
      }
      acc[row.SIRET].push(row);
      return acc;
    },
    {} as Record<string, ImportedAgencyAndUserRow[]>,
  );

  const updatedRowsWithSuffix: ImportedAgencyAndUserRow[] =
    rowsToCreateAsAgencies.map((row) => {
      const needSuffix = rowsGroupedBySiret[row.SIRET].length > 1;
      const kind = row["Type structure"];
      return {
        ...row,
        "Nom structure": `${row["Nom structure"]}${needSuffix ? ` - ${kind}` : ""}`,
      };
    });

  const chunkSize = 100;
  const chunks = splitEvery(chunkSize, updatedRowsWithSuffix);
  await Promise.all(
    chunks.map(async (rows) => {
      await createNewAgencies({
        importedAgencyAndUserRows: rows,
        agencyRepository,
        userRepository,
        deps,
      });
    }),
  );
};
