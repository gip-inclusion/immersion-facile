import { values } from "ramda";
import {
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type DateString,
  errors,
} from "shared";
import type {
  ConventionPhoneIds,
  ConventionRepository,
} from "../ports/ConventionRepository";

export class InMemoryConventionRepository implements ConventionRepository {
  #conventions: Record<string, ConventionDto> = {};

  public get conventions() {
    return Object.values(this.#conventions);
  }

  public async deprecateConventionsWithoutDefinitiveStatusEndedSince(
    endedSince: Date,
  ): Promise<ConventionId[]> {
    const conventionsToDeprecate = await Promise.all(
      values(this.#conventions)
        .filter(
          (convention) =>
            convention.dateEnd <= endedSince.toISOString() &&
            ![
              "REJECTED",
              "CANCELLED",
              "DEPRECATED",
              "ACCEPTED_BY_VALIDATOR",
            ].includes(convention.status),
        )
        .map((convention) =>
          this.update({
            conventionDto: {
              ...convention,
              status: "DEPRECATED",
              statusJustification: `Devenu obsolète car statut ${convention.status} alors que la date de fin est dépassée depuis longtemps`,
            },
            phoneIds: {
              beneficiary: 0,
              establishmentTutor: 0,
              establishmentRepresentative: 0,
              beneficiaryRepresentative: 0,
              beneficiaryCurrentEmployer: 0,
            },
          }),
        ),
    );
    return conventionsToDeprecate.filter((id) => id !== undefined);
  }

  public async deleteOldConventions(_params: {
    updatedBefore: Date;
  }): Promise<ConventionId[]> {
    throw errors.generic.fakeError("Not implemented");
  }

  public async getById(id: ConventionId) {
    return this.#conventions[id];
  }

  public async save(params: {
    conventionDto: ConventionDto;
    phoneIds: ConventionPhoneIds;
    now?: DateString;
  }): Promise<void> {
    const { conventionDto } = params;
    const { id } = conventionDto;
    if (this.#conventions[id])
      throw errors.convention.conflict({ conventionId: id });

    this.#conventions[id] = dropConventionReadFields(conventionDto);
  }

  // for test purpose
  public setConventions(conventions: ConventionDto[]) {
    this.#conventions = conventions.reduce<Record<ConventionId, ConventionDto>>(
      (acc, convention) => ({
        ...acc,
        [convention.id]: dropConventionReadFields(convention),
      }),
      {},
    );
  }

  public async update(params: {
    conventionDto: ConventionDto;
    phoneIds?: Partial<ConventionPhoneIds>;
    now?: DateString;
  }): Promise<ConventionId | undefined> {
    const { conventionDto } = params;
    const { id } = conventionDto;
    if (!this.#conventions[id]) return;

    this.#conventions[id] = dropConventionReadFields(conventionDto);
    return id;
  }
}

const dropConventionReadFields = (
  convention: ConventionReadDto | ConventionDto,
): ConventionDto => {
  const {
    agencyCounsellorEmails: _1,
    agencyValidatorEmails: _2,
    agencyDepartment: _3,
    agencyKind: _4,
    agencyName: _5,
    agencySiret: _6,
    agencyContactEmail: _7,
    agencyRefersTo: _8,
    assessment: _9,
    ...conventionWithoutReadFields
  } = convention as ConventionReadDto;
  return conventionWithoutReadFields;
};
