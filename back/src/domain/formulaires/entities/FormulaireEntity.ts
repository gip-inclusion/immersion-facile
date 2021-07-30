import { FormulaireDto } from "../../../shared/FormulaireDto";

type FormulaireProps = {
    email: string;
    dateStart: Date;
    dateEnd: Date;
};

export class FormulaireEntity {
    public readonly email: string;
    public readonly dateStart: Date;
    public readonly dateEnd: Date;

    private constructor({ email, dateStart, dateEnd }: FormulaireProps) {
        this.email = email;
        this.dateStart = dateStart;
        this.dateEnd = dateEnd;
    }

    public static create(dto: FormulaireDto) {
      // TODO: Find a more precise email validation method. This is a simplified regex that 
      // accepts some invalid email addresses. 
      // For details see https://stackoverflow.com/questions/201323
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(dto.email)) {
        throw new Error(`Email must match the RFC standard: ${dto.email}`);
      }

      if (dto.dateEnd <= dto.dateStart) {
        throw new Error(`The start date must be before the end date.`);
      }

      return new FormulaireEntity({
        email: dto.email,
        dateStart: dto.dateStart,
        dateEnd: dto.dateEnd,
      });
    }
}

export const formulaireEntityToDto = (entity: FormulaireEntity): FormulaireDto => ({
    email: entity.email,
    dateStart: entity.dateStart,
    dateEnd: entity.dateEnd
});
