import { envs } from "../../config";
import { CategoryModel } from "../mongo/models/category.model";
import { ProductModel } from "../mongo/models/product.model";
import { UserModel } from "../mongo/models/user.model";
import { MongoDatabase } from "../mongo/mongo-database";
import { seedData } from "./data";

(async () => {
  await MongoDatabase.connect({
    dbName: envs.MONGO_DB_NAME,
    mongoUrl: envs.MONGO_URL,
  });
  await main();
  await MongoDatabase.disconnect();
})();

async function main() {
  await Promise.all([
    UserModel.deleteMany(),
    CategoryModel.deleteMany(),
    ProductModel.deleteMany(),
  ]);

  const users = await UserModel.insertMany(seedData.users);

  const categories = await CategoryModel.insertMany(
    seedData.categories.map((cat) => {
      return {
        ...cat,
        user: users[Math.floor(Math.random() * users.length)]._id,
      };
    })
  );

  await ProductModel.insertMany(
    seedData.products.map((prod) => {
      return {
        ...prod,
        user: users[Math.floor(Math.random() * users.length)]._id,
        category: categories[Math.floor(Math.random() * categories.length)]._id,
      };
    })
  );

  console.log("ok");
}
