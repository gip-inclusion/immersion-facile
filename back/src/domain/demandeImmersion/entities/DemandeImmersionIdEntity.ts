type DemandeImmersionIdProps = {
  id: string;
};

export class DemandeImmersionIdEntity {
  public readonly id: string;

  private constructor(props: DemandeImmersionIdProps) {
    this.id = props.id;
  }

  public static create(id: string) {
    return new DemandeImmersionIdEntity({
      id,
    });
  }
}
