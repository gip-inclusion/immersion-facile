type FormulaireIdProps = {
  id: string;
};

export class FormulaireIdEntity {
  public readonly id: string;

  private constructor(props: FormulaireIdProps) {
    this.id = props.id;
  }

  public static create(id: string) {
    return new FormulaireIdEntity({
      id,
    });
  }
}
