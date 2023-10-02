import { BcryptAdapter, JwtAdapter, envs } from "../../config";
import { UserModel } from "../../data";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from "../../domain";
import { EmailService } from "./email.service";

export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    try {
      const existUser = await UserModel.findOne({
        email: registerUserDto.email,
      });

      if (existUser) throw CustomError.badRequest("Email already exists");

      const user = new UserModel(registerUserDto);
      user.password = BcryptAdapter.hash(registerUserDto.password);
      await user.save();

      // Enviar correo de validación
      await this.sendEmailValidationLink(user.email);

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

  private sendEmailValidationLink = async (email: string) => {
    const token = await JwtAdapter.generateToken({ email });
    if (!token) throw CustomError.internalServer("Error generating token");

    const link = `${envs.WEBSERVICE_URL}/auth/validate-email/${token}`;

    const html = `
      <h1>Verify your email</h1>
      <p>Click <a href="${link}">here</a> to verify your email</p>
    `;

    const isSent = await this.emailService.sendEmail({
      to: [email],
      subject: "Verify your email",
      htmlBody: html,
    });

    if (!isSent) throw CustomError.internalServer("Error sending email");

    return true;
  };

  public validateEmail = async (token: string) => {
    try {
      const payload = await JwtAdapter.validateToken(token);
      if (!payload) throw CustomError.unauthorized("Invalid token");

      const { email } = payload as { email: string };
      if (!email) throw CustomError.internalServer("Invalid email");

      const user = await UserModel.findOne({ email });
      if (!user) throw CustomError.internalServer("User does not exists");

      user.emailValidated = true;
      await user.save();

      return true;
    } catch (error) {
      throw CustomError.internalServer(`Error validating email: ${error}`);
    }
  };
}
