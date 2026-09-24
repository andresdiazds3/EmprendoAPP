import axios from "axios";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { api } from "./api";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

// Instancia de Axios limpia sin interceptores de JWT del backend para comunicarse con Cloudinary
const cloudinaryAxios = axios.create({
  timeout: 30000,
});

export async function uploadImageToCloudinary(
  localUri: string,
  folder: "products" | "profiles"
): Promise<CloudinaryUploadResult> {
  try {
    // 1. Redimensionar y comprimir la imagen local para optimizar ancho de banda y cuota
    const manipulated = await manipulateAsync(
      localUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    // 2. Solicitar firma de subida segura al backend
    const signatureResponse = await api.get(`/api/uploads/signature?folder=${folder}`);
    if (!signatureResponse.data?.success || !signatureResponse.data?.data) {
      throw new Error("No se pudo obtener la autorización para subir la imagen.");
    }

    const { signature, timestamp, apiKey, cloudName } = signatureResponse.data.data;

    // 3. Construir FormData compatible con React Native XMLHttpRequest
    const filename = manipulated.uri.split("/").pop() || `upload_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("file", {
      uri: manipulated.uri,
      type: "image/jpeg",
      name: filename,
    } as any);
    formData.append("api_key", String(apiKey));
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    // 4. POST directo a Cloudinary con Axios (evita el fallo 'Unsupported FormDataPart implementation' de fetch en React Native)
    const uploadResponse = await cloudinaryAxios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const uploadData = uploadResponse.data;

    return {
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
    };
  } catch (error: any) {
    console.error("Error al subir imagen a Cloudinary:", error);
    const serverMessage = error.response?.data?.error?.message;
    throw new Error(
      serverMessage ||
        (error.message && !error.message.includes("status code")
          ? error.message
          : "No se pudo subir la imagen, intenta de nuevo")
    );
  }
}

