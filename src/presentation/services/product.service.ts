import { ProductModel } from "../../data";
import { CreateProductDto, CustomError, PaginationDto } from "../../domain";

export class ProductService {
  constructor() {}

  async createProduct(createProductDto: CreateProductDto) {
    try {
      const productExists = await ProductModel.findOne({
        name: createProductDto.name,
      });

      if (productExists)
        throw CustomError.badRequest("Category already exists");

      const product = new ProductModel(createProductDto);
      await product.save();
      return product;
    } catch (error) {
      throw CustomError.internalServer(`Error creating product: ${error}`);
    }
  }
  async getProducts(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;

      const [products, total] = await Promise.all([
        ProductModel.find()
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("user", "name email")
          .populate("category", "name"),
        ProductModel.countDocuments(),
      ]);
      if (products.length === 0) return [];

      return {
        page,
        limit,
        total,
        next: `/api/products?page=${page + 1}&limit=${limit}`,
        previous:
          page - 1 > 0 ? `/api/products?page=${page - 1}&limit=${limit}` : null,
        products,
      };
    } catch (error) {
      throw CustomError.internalServer(`Error getting categories: ${error}`);
    }
  }
}
