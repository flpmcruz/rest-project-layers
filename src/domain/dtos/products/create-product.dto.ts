import { Validators } from "../../../config";

export class CreateProductDto {
  private constructor(
    public readonly name: string,
    public readonly available: boolean,
    public readonly price: number,
    public readonly description: string,
    public readonly user: string,
    public readonly category: string
  ) {}

  static create(props: { [key: string]: any }): [string?, CreateProductDto?] {
    const { name, available, price, description, user, category } = props;

    if (!name) return ["Name is required"];
    if (!Validators.isMongoID(category)) return ["Invalid category ID"];
    if (!Validators.isMongoID(user)) return ["Invalid user ID"];

    return [
      undefined,
      new CreateProductDto(name, available, price, description, user, category),
    ];
  }
}
