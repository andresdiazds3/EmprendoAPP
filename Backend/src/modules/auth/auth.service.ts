import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../core/errors";
import { authRepository } from "./auth.repository";
import { RegisterDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { emailService } from "../../shared/services/email.service";

export class AuthService {
  async register(dto: RegisterDto) {
    const existingUser = await authRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError("El email ya está registrado");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await authRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuario");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      // Retornar éxito silencioso para evitar la enumeración de emails
      console.log(`[ForgotPassword] Solicitud para email no registrado: ${email}`);
      return true;
    }

    // Invalida cualquier token previo sin usar
    await authRepository.invalidateUserResetTokens(user.id);

    // Genera un código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    console.log(`[ForgotPassword] Código de recuperación generado para ${email}: ${code} (SHA256 Hash guardado)`);

    // Hashea el código con SHA256 para guardar en base de datos
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_CODE_EXPIRES_MIN * 60 * 1000);

    // Guarda el token en base de datos
    await authRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    // Envía el correo mediante el servicio
    await emailService.sendPasswordResetEmail(user.email, code);

    return true;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Código inválido o expirado");
    }

    // Hashea el código recibido para buscar coincidencia en DB
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");

    // Busca un token válido
    const resetToken = await authRepository.findValidResetToken(user.id, tokenHash);
    if (!resetToken) {
      throw new UnauthorizedError("Código inválido o expirado");
    }

    // Hashea la nueva contraseña con bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualiza la contraseña en la base de datos
    await authRepository.updateUserPassword(user.id, passwordHash);

    // Invalida el token usado
    await authRepository.markResetTokenAsUsed(resetToken.id);

    return true;
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { sub: userId, email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
  }
}

export const authService = new AuthService();
