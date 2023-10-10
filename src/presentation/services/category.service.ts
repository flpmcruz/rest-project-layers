import { CategoryModel } from "../../data";
import { CustomError, PaginationDto, UserEntity } from "../../domain";
import { CreateCategoryDto } from "../../domain/dtos/category/create-category.dto";

export class CategoryService {
  constructor() {}

  async createCategory(createCategoryDto: CreateCategoryDto, user: UserEntity) {
    try {
      const categoryExists = await CategoryModel.findOne({
        name: createCategoryDto.name,
        user: user.id,
      });

      if (categoryExists)
        throw CustomError.badRequest("Category already exists");

      const category = new CategoryModel({
        ...createCategoryDto,
        user: user.id,
      });
      await category.save();

      return {
        id: category.id,
        name: category.name,
        available: category.available,
      };
    } catch (error) {
      throw CustomError.internalServer(`Error creating category: ${error}`);
    }
  }
  async getCategories(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;

      const [categories, total] = await Promise.all([
        CategoryModel.find()
          .skip((page - 1) * limit)
          .limit(limit),
        CategoryModel.countDocuments(),
      ]);
      if (categories.length === 0) return [];

      return {
        page,
        limit,
        total,
        next: `/api/categories?page=${page + 1}&limit=${limit}`,
        previous:
          page - 1 > 0
            ? `/api/categories?page=${page - 1}&limit=${limit}`
            : null,
        categories: categories.map((category) => ({
          id: category?.id,
          name: category?.name,
          available: category?.available,
        })),
      };
    } catch (error) {
      throw CustomError.internalServer(`Error getting categories: ${error}`);
    }
  }
}
