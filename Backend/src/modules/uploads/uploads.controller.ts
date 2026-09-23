import { Request, Response } from "express";
import { getSignatureSchema } from "./dtos/get-signature.dto";
import { cloudinaryService } from "../../shared/services/cloudinary.service";
import { ok } from "../../shared/utils/http-response";

export class UploadsController {
  async getSignature(req: Request, res: Response) {
    const { folder } = getSignatureSchema.parse(req.query);
    const signatureData = cloudinaryService.generateUploadSignature(folder);
    return ok(res, signatureData, "Firma de subida generada exitosamente");
  }
}

export const uploadsController = new UploadsController();
