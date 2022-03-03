import { z } from "zod";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  string,
  FormEstablishmentDto
> {
  inputSchema = z.string();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(siret: string, uow: UnitOfWork) {
    const establishment = await uow.immersionOfferRepo.getEstablishmentBySiret(
      siret,
    );
    if (!establishment) throw "Not found";

    const contact = await uow.immersionOfferRepo.getContactByEstablishmentSiret(
      siret,
    );
    if (!contact) throw new Error("No contact ");

    const offers = await uow.immersionOfferRepo.getOffersByEstablishmentSiret(
      siret,
    );
    const retrievedForm: FormEstablishmentDto = {
      siret,
      source: "immersion-facile", // ??
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddress: establishment.address,
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment?.nafDto,
      professions: offers.map((offer) => ({
        // immersion_offers : remove rome and add rome_code_appelation instead (from form)
        description: "???", // Libelle de l'appelation (infered from public_rome_appelation)
        romeCodeMetier: offer.romeCode, // Also nfered from public_rome_appelation
        romeCodeAppellation: offer.romeAppellation?.toString(),
      })),
      businessContacts: [
        {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          job: contact.job,
          phone: contact.phone,
        },
      ],
      preferredContactMethods: [contact.contactMethod],
    };
    return retrievedForm;
  }
}
