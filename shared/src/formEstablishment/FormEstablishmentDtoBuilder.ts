import { Builder } from "../Builder";
import { WithAcquisition } from "../acquisition.dto";
import { AppellationAndRomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";
import {
  BusinessContactDto,
  EstablishmentCSVRow,
  EstablishmentSearchableBy,
  FormEstablishmentAddress,
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "./formEstablishment.dto";
import {
  defaultMaxContactsPerWeek,
  noContactPerWeek,
} from "./formEstablishment.schema";

export const defaultFormEstablishmentAddress = {
  id: "364efc5a-db4f-452c-8d20-95c6a23f21fe",
  rawAddress: "1 Rue du Moulin, 12345 Quelque Part",
};

export const defaultValidFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddresses: [defaultFormEstablishmentAddress],
  businessContact: {
    email: "amil@mail.com",
    firstName: "Esteban",
    lastName: "Ocon",
    phone: "+33612345678",
    job: "a job",
    contactMethod: "EMAIL",
    copyEmails: ["copy1@mail.com", "copy2@mail.com"],
  },
  naf: { code: "A", nomenclature: "nomenclature code A" },
  businessName: "Ma super entreprise",
  businessNameCustomized: "Ma belle enseigne du quartier",
  isEngagedEnterprise: false,
  siret: "01234567890123",
  website: "www@super.com/jobs",
  additionalInformation: "",
  appellations: [
    {
      romeCode: "A1111",
      appellationCode: "11111",
      romeLabel: "Boulangerie",
      appellationLabel: "Boulanger - Boulangère",
    },
    {
      romeCode: "B9112",
      appellationCode: "22222",
      romeLabel: "Patissier",
      appellationLabel: "Patissier - Patissière",
    },
    {
      romeCode: "D1103",
      appellationCode: "33333",
      romeLabel: "Boucherie",
      appellationLabel: "Boucher / Bouchère",
    },
  ],
  maxContactsPerWeek: defaultMaxContactsPerWeek,
  searchableBy: {
    jobSeekers: true,
    students: true,
  },
  acquisitionKeyword: undefined,
  acquisitionCampaign: undefined,
};

export const fullyUpdatedFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddresses: [
    {
      id: "fbd6096d-b514-4d54-a16e-46c89f75d83c",
      rawAddress: "1 rue de la paix, 75001 Paris",
    },
    {
      id: "fbd6096d-b514-4d54-a16e-46c89f75d83d",
      rawAddress: "2 rue de la paix, 93000 Bobigny",
    },
  ],
  businessContact: {
    email: "my-updated-email@test.com",
    contactMethod: "PHONE",
    firstName: "Jean-Luc",
    lastName: "Deloin",
    copyEmails: ["updated-copy-email@test.com"],
    job: "new job",
    phone: "+33612345679",
  },
  naf: { code: "B", nomenclature: "nomenclature code B" },
  businessName: "Edited Business Name",
  siret: "01234567890123",
  website: "https://updated.website.com",
  additionalInformation: "This is an updated information",
  appellations: [
    {
      romeCode: "A1234",
      appellationCode: "11234",
      romeLabel: "Label rome 1",
      appellationLabel: "Appellation 1",
    },
    {
      romeCode: "B1234",
      appellationCode: "21234",
      romeLabel: "Label rome 2",
      appellationLabel: "Appellation 2",
    },
  ],
  maxContactsPerWeek: defaultMaxContactsPerWeek - 5,
  searchableBy: {
    jobSeekers: false,
    students: true,
  },
  businessNameCustomized: "Updated Business Name",
  fitForDisabledWorkers: false,
  isEngagedEnterprise: false,
  nextAvailabilityDate: new Date("2025-01-01").toISOString(),
};

const emptyFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddresses: [
    {
      id: "",
      rawAddress: "",
    },
  ],
  naf: { code: "", nomenclature: "" },
  businessContact: {
    contactMethod: "EMAIL",
    lastName: "",
    firstName: "",
    phone: "",
    email: "",
    job: "",
    copyEmails: [],
  },
  businessName: "",
  siret: "",
  appellations: [],
  website: "",
  additionalInformation: "",
  maxContactsPerWeek: defaultMaxContactsPerWeek,
  searchableBy: {
    jobSeekers: true,
    students: false,
  },
  acquisitionKeyword: undefined,
  acquisitionCampaign: undefined,
};

export class FormEstablishmentDtoBuilder
  implements Builder<FormEstablishmentDto>
{
  #dto: FormEstablishmentDto;

  constructor(dto: FormEstablishmentDto) {
    this.#dto = dto;
  }

  public static valid() {
    return new FormEstablishmentDtoBuilder(defaultValidFormEstablishment);
  }

  public static allEmptyFields() {
    return new FormEstablishmentDtoBuilder(emptyFormEstablishment);
  }

  public static fullyUpdated() {
    return new FormEstablishmentDtoBuilder(fullyUpdatedFormEstablishment);
  }

  public build() {
    return this.#dto;
  }

  public buildCsvRow(): EstablishmentCSVRow {
    return formEstablishmentToEstablishmentCsvRow(this.#dto);
  }

  public withAppellations(appellations: AppellationAndRomeDto[]) {
    return new FormEstablishmentDtoBuilder({
      ...this.#dto,
      appellations,
    });
  }

  public withBusinessAddresses(businessAddresses: FormEstablishmentAddress[]) {
    return new FormEstablishmentDtoBuilder({ ...this.#dto, businessAddresses });
  }

  public withBusinessContact(businessContact: BusinessContactDto) {
    return new FormEstablishmentDtoBuilder({ ...this.#dto, businessContact });
  }

  public withBusinessContactEmail(email: string) {
    return new FormEstablishmentDtoBuilder({
      ...this.#dto,
      businessContact: { ...this.#dto.businessContact, email },
    });
  }

  public withBusinessName(businessName: string) {
    return new FormEstablishmentDtoBuilder({ ...this.#dto, businessName });
  }

  public withFitForDisabledWorkers(fitForDisabledWorkers: boolean) {
    return new FormEstablishmentDtoBuilder({
      ...this.#dto,
      fitForDisabledWorkers,
    });
  }

  public withMaxContactsPerWeek(maxContactsPerWeek: number) {
    return new FormEstablishmentDtoBuilder({
      ...this.#dto,
      maxContactsPerWeek,
    });
  }

  public withNextAvailabilityDate(nextAvailabilityDate: Date | undefined) {
    return new FormEstablishmentDtoBuilder({
      ...this.#dto,
      nextAvailabilityDate: nextAvailabilityDate?.toISOString(),
    });
  }

  public withSiret(siret: SiretDto) {
    return new FormEstablishmentDtoBuilder({ ...this.#dto, siret });
  }

  public withSource(source: FormEstablishmentSource) {
    return new FormEstablishmentDtoBuilder({ ...this.#dto, source });
  }

  public withAcquisition(params: WithAcquisition) {
    return new FormEstablishmentDtoBuilder({ ...this.#dto, ...params });
  }

  public withSearchableBy({ jobSeekers, students }: EstablishmentSearchableBy) {
    return new FormEstablishmentDtoBuilder({
      ...this.#dto,
      searchableBy: { jobSeekers, students },
    });
  }
}

const formEstablishmentToEstablishmentCsvRow = (
  establishment: FormEstablishmentDto,
): EstablishmentCSVRow => ({
  businessAddress: establishment.businessAddresses[0].rawAddress,
  businessContact_email: establishment.businessContact.email,
  businessContact_firstName: establishment.businessContact.firstName,
  businessContact_lastName: establishment.businessContact.lastName,
  businessContact_phone: establishment.businessContact.phone,
  businessContact_job: establishment.businessContact.job,
  businessContact_contactMethod: establishment.businessContact.contactMethod,
  businessContact_copyEmails:
    establishment.businessContact.copyEmails.join(","),
  naf_code: establishment.naf?.code ?? "",
  businessName: establishment.businessName,
  businessNameCustomized: establishment.businessNameCustomized ?? "",
  siret: establishment.siret,
  website: establishment.website ?? "",
  additionalInformation: establishment.additionalInformation ?? "",
  appellations_code: establishment.appellations
    .map((appellation) => appellation.appellationCode)
    .join(","),
  isEngagedEnterprise: establishment.isEngagedEnterprise ? "1" : "0",
  isSearchable: establishment.maxContactsPerWeek > noContactPerWeek ? "1" : "0",
  fitForDisabledWorkers: establishment.fitForDisabledWorkers ? "1" : "0",
  searchableByStudents: establishment.searchableBy.students ? "1" : "0",
  searchableByJobSeekers: establishment.searchableBy.jobSeekers ? "1" : "0",
});
