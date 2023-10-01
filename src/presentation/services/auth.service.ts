import { BcryptAdapter, JwtAdapter } from "../../config";
import { UserModel } from "../../data";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from "../../domain";

export class AuthService {
  constructor() {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    try {
      const existUser = await UserModel.findOne({
        email: registerUserDto.email,
      });

      if (existUser) throw CustomError.badRequest("Email already exists");

      const user = new UserModel(registerUserDto);
      user.password = BcryptAdapter.hash(registerUserDto.password);
      await user.save();

      // Convertir el modelo de mongoose a una entidad de dominio
      const { password, ...rest } = UserEntity.fromObject(user);

      // Generar el token
      const token = await JwtAdapter.generateToken({
        id: user.id,
        email: rest.email,
      });
      if (!token) throw CustomError.internalServer("Error generating token");

      return {
        user: rest,
        token,
      };
    } catch (error) {
      throw CustomError.internalServer(`Error registering user: ${error}`);
    }
  }

  public async loginUser(LoginUserDto: LoginUserDto) {
    try {
      // Validate user exists with email
      const user = await UserModel.findOne({
        email: LoginUserDto.email,
      });
      if (!user) throw CustomError.badRequest("User does not exists");

      // Validate password
      const isMatch = BcryptAdapter.compare(
        LoginUserDto.password,
        user.password
      );
      if (!isMatch) throw CustomError.badRequest("Invalid password");

      // Convertir el modelo de mongoose a una entidad de dominio
      const { password, ...rest } = UserEntity.fromObject(user);

      // Generar el token
      const token = await JwtAdapter.generateToken({
        id: user.id,
        email: rest.email,
      });
      if (!token) throw CustomError.internalServer("Error generating token");
      return {
        user: rest,
        token,
      };
    } catch (error) {
      throw CustomError.internalServer(`Error login user: ${error}`);
    }
  }
}
