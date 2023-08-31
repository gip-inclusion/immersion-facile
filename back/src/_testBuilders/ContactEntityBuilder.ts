import { Builder } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import {
  ContactEntity as ContactEntity,
  ContactMethod,
} from "../domain/offer/entities/ContactEntity";

const validContactEntityV2: ContactEntity = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  lastName: "Prost",
  firstName: "Alain",
  email: "alain.prost@email.fr",
  job: "le big boss",
  phone: "0612345678",
  contactMethod: "EMAIL",
  copyEmails: [],
};

export class ContactEntityBuilder implements Builder<ContactEntity> {
  constructor(private readonly entity: ContactEntity = validContactEntityV2) {}

  build() {
    return this.entity;
  }

  withContactMethod(contactMethod: ContactMethod) {
    return new ContactEntityBuilder({ ...this.entity, contactMethod });
  }

  withCopyEmails(copyEmails: string[]) {
    return new ContactEntityBuilder({ ...this.entity, copyEmails });
  }

  withEmail(email: string) {
    return new ContactEntityBuilder({ ...this.entity, email });
  }

  withFirstname(firstName: string) {
    return new ContactEntityBuilder({ ...this.entity, firstName });
  }

  withGeneratedContactId() {
    return this.withId(new UuidV4Generator().new());
  }

  withId(id: string) {
    return new ContactEntityBuilder({ ...this.entity, id });
  }

  withLastname(lastName: string) {
    return new ContactEntityBuilder({ ...this.entity, lastName });
  }

  withPhone(phone: string) {
    return new ContactEntityBuilder({ ...this.entity, phone });
  }
}
