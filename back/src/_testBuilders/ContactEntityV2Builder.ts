import {
  ContactEntityV2,
  ContactMethod,
} from "../domain/immersionOffer/entities/ContactEntity";
import { Builder } from "./Builder";

const validContactEntityV2: ContactEntityV2 = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  lastName: "Prost",
  firstName: "Alain",
  email: "alain.prost@email.fr",
  job: "le big boss",
  phone: "0612345678",
  contactMethod: "EMAIL",
};

export class ContactEntityV2Builder implements Builder<ContactEntityV2> {
  constructor(
    private readonly entity: ContactEntityV2 = validContactEntityV2,
  ) {}

  withId(id: string) {
    return new ContactEntityV2Builder({ ...this.entity, id });
  }

  withContactMethod(contactMethod: ContactMethod) {
    return new ContactEntityV2Builder({ ...this.entity, contactMethod });
  }

  withEmail(email: string) {
    return new ContactEntityV2Builder({ ...this.entity, email });
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
