import https from "node:https";
import { env } from "../../config/env";
import { AppError } from "../../core/errors";

export class EmailService {
  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        sender: {
          name: env.BREVO_SENDER_NAME || "Emprendo",
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: "Tu código para recuperar tu contraseña en Emprendo",
        htmlContent: `
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

      const options = {
        hostname: "api.brevo.com",
        port: 443,
        path: "/v3/smtp/email",
        method: "POST",
        family: 4,
        headers: {
          "api-key": env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Accept: "application/json",
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            console.error("Error en respuesta de Brevo API:", res.statusCode, responseBody);
            reject(new AppError("No se pudo enviar el correo de recuperación de contraseña.", 500));
          }
        });
      });

      req.on("error", (err) => {
        console.error("Excepción al enviar correo con Brevo:", err);
        reject(new AppError("No se pudo enviar el correo de recuperación de contraseña.", 500));
      });

      req.write(payload);
      req.end();
    });
  }
}

export const emailService = new EmailService();


