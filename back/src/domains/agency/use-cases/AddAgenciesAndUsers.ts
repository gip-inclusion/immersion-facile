import { flatten, splitEvery, uniq, values } from "ramda";
import {
  type AgencyWithUsersRights,
  type DepartmentCode,
  errors,
  executeInSequence,
  type GeoPositionDto,
  geoPositionSchema,
  type PhoneNumber,
  phoneNumberSchema,
  type SiretDto,
} from "shared";
import { z } from "zod";
import { getUserByEmailAndCreateIfMissing } from "../../connected-users/helpers/connectedUser.helper";
import type { AddressGateway } from "../../core/address/ports/AddressGateway";
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
    addressGateway: AddressGateway;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const usecaseErrors: Record<string, Error> = {};
    const chunkSize = 300;
    const formattedImportedAgencies =
      formatImportedAgencyAndUserRow(inputParams);
    const chunks = splitEvery(chunkSize, formattedImportedAgencies);
    const siretsInIF = uniq(
      flatten(
        await Promise.all(
          chunks.map(async (importedAgencies) =>
            uow.agencyRepository.getExistingActiveSirets(
              importedAgencies.map((importedAgency) => importedAgency.SIRET),
            ),
          ),
        ),
      ),
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

    await linkUsersToExistingAgency({
      siretsInIF,
      importedAgencyAndUserRows: formattedImportedAgencies,
      agencyRepository: uow.agencyRepository,
      userRepository: uow.userRepository,
      usecaseErrors,
    });

    await createNewAgencies({
      importedAgencyAndUserRows: rowsWithDuplicates,
      agencyRepository: uow.agencyRepository,
      userRepository: uow.userRepository,
      deps,
      usecaseErrors,
    });

    await createNewAgenciesWithSuffix({
      allRows: formattedImportedAgencies,
      rowsToCreateAsAgencies: uniqRows,
      agencyRepository: uow.agencyRepository,
      userRepository: uow.userRepository,
      deps,
      usecaseErrors,
    });

    return {
      siretAlreadyInIFCount: siretsInIF.length,
      createdAgenciesCount: rowsWithDuplicates.length + uniqRows.length,
      createdUsersCount,
      usersAlreadyInIFCount,
      usecaseErrors,
    };
  });

const linkUsersToExistingAgency = async ({
  siretsInIF,
  importedAgencyAndUserRows,
  agencyRepository,
  userRepository,
  usecaseErrors,
}: {
  siretsInIF: SiretDto[];
  importedAgencyAndUserRows: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
  usecaseErrors: Record<string, Error>;
}): Promise<void> => {
  const rowsWithSiretAlreadyInIF = importedAgencyAndUserRows.filter((row) =>
    siretsInIF.includes(row.SIRET),
  );
  const chunkSize = 30;
  const chunks = splitEvery(chunkSize, rowsWithSiretAlreadyInIF);

  await executeInSequence(chunks, async (rows) => {
    const agenciesIF = await agencyRepository.getAgencies({
      filters: {
        sirets: rows.map((row) => row.SIRET),
      },
    });

    rows.map(async (row) => {
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
      if (!user) {
        usecaseErrors[row.ID] = errors.user.notFoundByEmail({
          email: row["E-mail authentification"],
        });
        return;
      }

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
    });
  });
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
  usecaseErrors,
}: {
  importedAgencyAndUserRows: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
  deps: {
    uuidGenerator: UuidGenerator;
    timeGateway: TimeGateway;
    addressGateway: AddressGateway;
  };
  usecaseErrors: Record<string, Error>;
}) => {
  await executeInSequence(importedAgencyAndUserRows, async (row) => {
    const user = await userRepository.findByEmail(
      row["E-mail authentification"],
    );
    if (!user) {
      usecaseErrors[row.ID] = errors.user.notFoundByEmail({
        email: row["E-mail authentification"],
      });
      return;
    }

    const agencyDepartmentCode = await getDepartementCode({
      row,
      addressGateway: deps.addressGateway,
    });
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
  });
};

// duplicas si même siret + nom structure + e-mail authentification + lat + long + téléphone
function findDuplicatesInImportedRows(
  rows: ImportedAgencyAndUserRow[],
): Record<string, ImportedAgencyAndUserRow[]> {
  const groupedRows = rows.reduce(
    (acc, row) => {
      const key = [
        row.SIRET,
        row["Nom structure"],
        row["E-mail authentification"],
        row["Coordonées"],
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
  usecaseErrors,
}: {
  allRows: ImportedAgencyAndUserRow[];
  rowsToCreateAsAgencies: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
  deps: {
    uuidGenerator: UuidGenerator;
    timeGateway: TimeGateway;
    addressGateway: AddressGateway;
  };
  usecaseErrors: Record<string, Error>;
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

  await createNewAgencies({
    importedAgencyAndUserRows: updatedRowsWithSuffix,
    agencyRepository,
    userRepository,
    deps,
    usecaseErrors,
  });
};

const getDepartementCode = async ({
  row,
  addressGateway,
}: {
  row: ImportedAgencyAndUserRow;
  addressGateway: AddressGateway;
}): Promise<DepartmentCode> => {
  // DOM-COM
  if (
    row["Code postal"].startsWith("97") ||
    row["Code postal"].startsWith("98")
  ) {
    return row["Code postal"].slice(0, 3);
  }

  // CORSE
  if (row["Code postal"].startsWith("20")) {
    const searchQuery = `${row["Adresse ligne 1"]} ${row["Code postal"]} ${row.Ville}`;
    const results = await addressGateway.lookupStreetAddress(searchQuery);
    const agencyDepartmentCode = results.at(0)?.address.departmentCode;
    if (results.length === 0 || !agencyDepartmentCode) {
      throw errors.address.notFound({
        address: searchQuery,
      });
    }
    return agencyDepartmentCode;
  }

  // METROPOLE
  return row["Code postal"].slice(0, 2);
};
