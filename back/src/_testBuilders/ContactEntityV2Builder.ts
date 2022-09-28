import { Builder } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import {
  ContactEntityV2,
  ContactMethod,
} from "../domain/immersionOffer/entities/ContactEntity";

const validContactEntityV2: ContactEntityV2 = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  lastName: "Prost",
  firstName: "Alain",
  email: "alain.prost@email.fr",
  job: "le big boss",
  phone: "0612345678",
  contactMethod: "EMAIL",
  copyEmails: [],
};

export class ContactEntityV2Builder implements Builder<ContactEntityV2> {
  constructor(
    private readonly entity: ContactEntityV2 = validContactEntityV2,
  ) {}

  withId(id: string) {
    return new ContactEntityV2Builder({ ...this.entity, id });
  }
  withGeneratedContactId() {
    return this.withId(new UuidV4Generator().new());
  }
  withContactMethod(contactMethod: ContactMethod) {
    return new ContactEntityV2Builder({ ...this.entity, contactMethod });
  }

  withEmail(email: string) {
    return new ContactEntityV2Builder({ ...this.entity, email });
  }
  withCopyEmails(copyEmails: string[]) {
    return new ContactEntityV2Builder({ ...this.entity, copyEmails });
  }

  withFirstname(firstName: string) {
    return new ContactEntityV2Builder({ ...this.entity, firstName });
  }

  withLastname(lastName: string) {
    return new ContactEntityV2Builder({ ...this.entity, lastName });
  }

  withPhone(phone: string) {
    return new ContactEntityV2Builder({ ...this.entity, phone });
  }

  build() {
    return this.entity;
  }
}
