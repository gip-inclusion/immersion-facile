import { splitEvery, uniq } from "ramda";
import { type AgencyWithUsersRights, type Phone, phoneSchema } from "shared";
import { z } from "zod";
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
  Téléphone: Phone;
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
    Téléphone: phoneSchema,
  });

export type AddAgenciesAndUsers = ReturnType<typeof makeAddAgenciesAndUsers>;
export const makeAddAgenciesAndUsers = useCaseBuilder("AddAgenciesAndUsers")
  .withInput<ImportedAgencyAndUserRow[]>(
    z.array(importedAgencyAndUserRowSchema),
  )
  .withOutput<{
    createdAgenciesCount: number;
    createdUsersCount: number;
    updatedUsersCount: number;
  }>()
  .withDeps<{
    uuidGenerator: UuidGenerator;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const chunkSize = 500;
    const chunks = splitEvery(chunkSize, inputParams);
    const results = await Promise.all(
      chunks.map(async (importedAgencies) => {
        const existingAgencies = await uow.agencyRepository.getAgencies({
          filters: {
            sirets: importedAgencies.map(
              (importedAgency) => importedAgency.SIRET,
            ),
          },
        });

        const { createdUsersCount, updatedUsersCount } =
          await addOrUpdateAgencyUsers({
            agenciesIF: existingAgencies,
            importedAgencyAndUserRows: importedAgencies,
            agencyRepository: uow.agencyRepository,
            userRepository: uow.userRepository,
            deps,
          });

        return {
          createdUsersCount,
          updatedUsersCount,
        };
      }),
    );

    return {
      createdAgenciesCount: 0,
      createdUsersCount: results.reduce(
        (acc, curr) => acc + curr.createdUsersCount,
        0,
      ),
      updatedUsersCount: results.reduce(
        (acc, curr) => acc + curr.updatedUsersCount,
        0,
      ),
    };
  });

const addOrUpdateAgencyUsers = async ({
  agenciesIF,
  importedAgencyAndUserRows,
  agencyRepository,
  userRepository,
  deps,
}: {
  agenciesIF: AgencyWithUsersRights[];
  importedAgencyAndUserRows: ImportedAgencyAndUserRow[];
  agencyRepository: AgencyRepository;
  userRepository: UserRepository;
  deps: { uuidGenerator: UuidGenerator; timeGateway: TimeGateway };
}) => {
  const siretsInIF = agenciesIF.map((agency) => agency.agencySiret);
  const rowsWithSiretAlreadyInIF = importedAgencyAndUserRows.filter((row) =>
    siretsInIF.includes(row.SIRET),
  );

  const results = (
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
        const userWithRoles = user ? agencyIF.usersRights[user.id] : undefined;
        const newUserUUid = deps.uuidGenerator.new();

        if (!user) {
          await userRepository.save({
            id: newUserUUid,
            email: row["E-mail authentification"],
            firstName: "",
            lastName: "",
            createdAt: deps.timeGateway.now().toISOString(),
            proConnect: null,
            isBackofficeAdmin: false,
          });
        }

        await agencyRepository.update({
          id: agencyIF.id,
          usersRights: {
            ...agencyIF.usersRights,
            [user ? user.id : newUserUUid]: {
              roles: uniq([
                ...(userWithRoles ? userWithRoles.roles : []),
                "agency-admin",
                "validator",
              ]),
              isNotifiedByEmail: userWithRoles?.isNotifiedByEmail ?? true,
            },
          },
        });

        return {
          createdUsers: user ? 0 : 1,
          updatedUser: user ? [row["E-mail authentification"]] : [],
        };
      }),
    )
  ).reduce(
    (acc, curr) => ({
      createdUsersCount: acc.createdUsersCount + curr.createdUsers,
      updatedUsers: [...acc.updatedUsers, ...curr.updatedUser],
    }),
    { createdUsersCount: 0, updatedUsers: [] as string[] },
  );

  return {
    createdUsersCount: results.createdUsersCount,
    updatedUsersCount: uniq(results.updatedUsers).length,
  };
};
