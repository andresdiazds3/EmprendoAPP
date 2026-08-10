import { Resend } from "resend";
import { env } from "../../config/env";
import { AppError } from "../../core/errors";

const resend = new Resend(env.RESEND_API_KEY);

export class EmailService {
  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    try {
      const { error } = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to,
        subject: "Tu código para recuperar tu contraseña en Emprendo",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
            <h2 style="color: #1A1A1A; text-align: center;">Recuperación de Contraseña</h2>
            <p style="color: #6B7280; font-size: 15px; line-height: 1.5; text-align: center;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Emprendo</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #6D28D9; letter-spacing: 4px; padding: 12px 24px; background-color: #F7F5FB; border-radius: 8px; border: 1px dashed #6D28D9;">
                ${code}
              </span>
            </div>
            <p style="color: #6B7280; font-size: 13px; text-align: center;">
              Este código de un solo uso es válido por <strong>${env.PASSWORD_RESET_CODE_EXPIRES_MIN} minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Error al enviar correo con Resend:", error);
        throw new AppError("No se pudo enviar el correo de recuperación de contraseña.", 500);
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      console.error("Excepción al enviar correo con Resend:", err);
      throw new AppError("No se pudo enviar el correo de recuperación de contraseña.", 500);
    }
  }
}

export const emailService = new EmailService();
