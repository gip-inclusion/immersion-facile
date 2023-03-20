import {
  AppellationDto,
  FormEstablishmentDtoBuilder,
  GeoPositionDto,
  NafDto,
} from "shared";
import {
  avenueChampsElyseesDto,
  rueGuillaumeTellDto,
} from "../../../_testBuilders/addressDtos";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { SireneApiEstablishment } from "../../sirene/ports/SirenGateway";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { InsertEstablishmentAggregateFromForm } from "./InsertEstablishmentAggregateFromFormEstablishement";
import { SirenEstablishmentVO } from "../../sirene/valueObjects/SirenEstablishmentVO";
import { InMemorySirenGateway } from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

const fakeSiret = "90040893100013";
const fakePosition: GeoPositionDto = { lat: 49.119146, lon: 6.17602 };
const fakeAddress = avenueChampsElyseesDto;
const fakeBusinessContact = new ContactEntityBuilder().build();

const expectedNafDto: NafDto = { code: "8559A", nomenclature: "nomencl" };

const prepareSireneRepo = (
  sirenGateway: InMemorySirenGateway,
  siret: string,
  trancheEffectifsUniteLegale?: string,
) => {
  const sireneEstablishmentFromAPI = new SirenEstablishmentVO({
    siret,
    uniteLegale: {
      activitePrincipaleUniteLegale: "85.59A",
      trancheEffectifsUniteLegale: trancheEffectifsUniteLegale ?? "01",
      nomenclatureActivitePrincipaleUniteLegale: "nomencl",
    },
  } as SireneApiEstablishment);

  sirenGateway.setEstablishment(sireneEstablishmentFromAPI);
};

describe("Insert Establishment aggregate from form data", () => {
  let sireneRepo: InMemorySirenGateway;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let addressAPI: InMemoryAddressGateway;
  let useCase: InsertEstablishmentAggregateFromForm;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    sireneRepo = new InMemorySirenGateway();
    establishmentAggregateRepo = new InMemoryEstablishmentAggregateRepository();
    outboxRepo = new InMemoryOutboxRepository();
    addressAPI = new InMemoryAddressGateway();
    addressAPI.setAddressAndPosition([
      {
        address: fakeAddress,
        position: fakePosition,
      },
    ]);
    uuidGenerator = new TestUuidGenerator();

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository: establishmentAggregateRepo,
      outboxRepository: outboxRepo,
    });
    const timeGateway = new CustomTimeGateway();

    useCase = new InsertEstablishmentAggregateFromForm(
      uowPerformer,
      sireneRepo,
      addressAPI,
      uuidGenerator,
      timeGateway,
      makeCreateNewEvent({ timeGateway, uuidGenerator }),
    );
  });

  it("Converts Form Establishment in search format", async () => {
    // Prepare
    const professions: AppellationDto[] = [
      {
        romeCode: "A1101",
        appellationCode: "11717",
        romeLabel: "métier A",
        appellationLabel: "métier A.1",
      },
      {
        romeCode: "A1102",
        appellationCode: "11717",
        romeLabel: "métier B",
        appellationLabel: "métier B.1",
      },
    ];
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withFitForDisabledWorkers(true)
      .withSiret(fakeSiret)
      .withAppellations(professions)
      .withBusinessContact(fakeBusinessContact)
      .build();

    prepareSireneRepo(sireneRepo, fakeSiret);

    // Act
    await useCase.execute(formEstablishment);

    // Assert
    expectEstablishmentAggregateInRepo({
      siret: fakeSiret,
      nafDto: expectedNafDto,
      offerRomeCodesAndAppellations: [
        { romeCode: "A1101", appellationCode: "11717" },
        { romeCode: "A1102", appellationCode: "11717" },
      ],
      contactEmail: fakeBusinessContact.email,
      fitForDisabledWorkers: true,
    });
  });

  const expectEstablishmentAggregateInRepo = (expected: {
    siret: string;
    nafDto: NafDto;
    contactEmail: string;
    offerRomeCodesAndAppellations: {
      romeCode: string;
      appellationCode?: string;
    }[];
    fitForDisabledWorkers?: boolean;
  }) => {
    const repoEstablishmentAggregate =
      establishmentAggregateRepo.establishmentAggregates[0];

    expect(repoEstablishmentAggregate).toBeDefined();
    expect(repoEstablishmentAggregate.establishment.siret).toEqual(
      expected.siret,
    );
    expect(repoEstablishmentAggregate.establishment.nafDto).toEqual(
      expected.nafDto,
    );
    expect(repoEstablishmentAggregate.establishment.dataSource).toBe("form");
    expect(repoEstablishmentAggregate.establishment.fitForDisabledWorkers).toBe(
      expected.fitForDisabledWorkers,
    );

    // Contact
    expect(repoEstablishmentAggregate.contact).toBeDefined();
    expect(repoEstablishmentAggregate.contact?.email).toEqual(
      expected.contactEmail,
    );

    // Offer
    expect(repoEstablishmentAggregate.immersionOffers).toHaveLength(
      expected.offerRomeCodesAndAppellations.length,
    );
    expect(repoEstablishmentAggregate.immersionOffers).toMatchObject(
      expected.offerRomeCodesAndAppellations,
    );
  };

  it("Correctly converts establishment with a 'tranche d'effectif salarié' of 00", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(fakeSiret)
      .build();

    prepareSireneRepo(sireneRepo, fakeSiret, "00");

    await useCase.execute(formEstablishment);

    const establishmentAggregate =
      establishmentAggregateRepo.establishmentAggregates[0];
    expect(establishmentAggregate).toBeDefined();
    expect(establishmentAggregate.establishment.siret).toEqual(
      formEstablishment.siret,
    );
    expect(establishmentAggregate.establishment.numberEmployeesRange).toBe("0");
  });

  it("Removes (and replaces) establishment and offers with same siret if exists", async () => {
    const siret = "12345678911234";
    // Prepare : insert an establishment aggregate from LBB with siret
    const previousContact = new ContactEntityBuilder()
      .withEmail("previous.contact@gmail.com")
      .build();
    const previousEstablishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .withDataSource("api_labonneboite")
      .build();

    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(previousEstablishment)
      .withImmersionOffers([
        new ImmersionOfferEntityV2Builder().build(),
        new ImmersionOfferEntityV2Builder().build(),
      ])
      .withContact(previousContact)
      .build();
    establishmentAggregateRepo.establishmentAggregates = [previousAggregate];

    const newRomeCode = "A1101";
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withAppellations([
        {
          romeLabel: "Boulangerie",
          appellationLabel: "Boulanger",
          romeCode: newRomeCode,
          appellationCode: "22222",
        },
      ])
      .withBusinessContact(
        new ContactEntityBuilder().withEmail("new.contact@gmail.com").build(),
      )
      .build();

    prepareSireneRepo(sireneRepo, siret);

    addressAPI.setAddressAndPosition([
      {
        address: rueGuillaumeTellDto,
        position: { lat: 1, lon: 1 },
      },
    ]);

    // Act : execute use-case with same siret
    await useCase.execute(formEstablishment);

    // Assert
    // One aggregate only
    expect(establishmentAggregateRepo.establishmentAggregates).toHaveLength(1);

    // Establishment matches update from form
    const partialExpectedEstablishment: Partial<EstablishmentEntity> = {
      siret,
      address: rueGuillaumeTellDto,
      dataSource: "form",
      isActive: true,
      name: formEstablishment.businessName,
    };
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].establishment,
    ).toMatchObject(partialExpectedEstablishment);

    // Offers match update from form
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].immersionOffers,
    ).toHaveLength(1);
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].immersionOffers[0]
        .romeCode,
    ).toEqual(newRomeCode);

    // Contact match update from form
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].contact?.email,
    ).toBe("new.contact@gmail.com");
  });

  it("Publishes an event with the new establishment aggregate as payload", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(fakeSiret)
      .build();

    prepareSireneRepo(sireneRepo, fakeSiret, "00");

    await useCase.execute(formEstablishment);

    const establishmentAggregate =
      establishmentAggregateRepo.establishmentAggregates[0];
    expect(establishmentAggregate).toBeDefined();
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0].payload).toEqual(establishmentAggregate);
  });
});
