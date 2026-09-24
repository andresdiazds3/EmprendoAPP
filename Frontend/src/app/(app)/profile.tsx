import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { ImagePickerField } from "../../components/ImagePickerField";
import { uploadImageToCloudinary } from "../../lib/cloudinary";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [selectedLocalUri, setSelectedLocalUri] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null | undefined>(
    user?.profilePictureUrl
  );
  const [isImageCleared, setIsImageCleared] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Consulta los datos más recientes del perfil
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await api.get("/api/auth/me");
      return response.data.data;
    },
    initialData: user,
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profileData?.name || user?.name || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (profileData) {
      setValue("name", profileData.name || "");
      if (!selectedLocalUri && !isImageCleared) {
        setCurrentImageUrl(profileData.profilePictureUrl);
      }
    }
  }, [profileData, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      profilePictureUrl?: string | null;
      profilePicturePublicId?: string | null;
    }) => {
      const response = await api.patch("/api/users/me", payload);
      return response.data.data;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      refreshUser();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setSelectedLocalUri(null);
      setIsImageCleared(false);
      setSuccessMessage("Perfil actualizado exitosamente");
      Alert.alert("Éxito", "Tus datos de perfil han sido guardados correctamente.");
    },
    onError: (error: any) => {
      console.error("Error al actualizar perfil:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo actualizar el perfil. Intenta de nuevo.";
      setErrorMessage(msg);
    },
  });

  const handleImageSelected = (localUri: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedLocalUri(localUri);
    setCurrentImageUrl(localUri);
    setIsImageCleared(false);
  };

  const handleImageCleared = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedLocalUri(null);
    setCurrentImageUrl(null);
    setIsImageCleared(true);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    let imagePayload: {
      profilePictureUrl?: string | null;
      profilePicturePublicId?: string | null;
    } = {};

    if (selectedLocalUri) {
      try {
        setIsUploadingImage(true);
        const uploadRes = await uploadImageToCloudinary(selectedLocalUri, "profiles");
        imagePayload = {
          profilePictureUrl: uploadRes.url,
          profilePicturePublicId: uploadRes.publicId,
        };
      } catch (err: any) {
        setIsUploadingImage(false);
        const msg = err.message || "No se pudo subir la foto de perfil, intenta de nuevo";
        setErrorMessage(msg);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    } else if (isImageCleared) {
      imagePayload = {
        profilePictureUrl: null,
        profilePicturePublicId: null,
      };
    }

    updateMutation.mutate({
      name: values.name,
      ...imagePayload,
    });
  };

  const isBusy = updateMutation.isPending || isUploadingImage || isLoadingProfile;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Mensajes de éxito / error */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓ {successMessage}</Text>
            </View>
          )}

          {/* Selector de Foto de Perfil */}
          <ImagePickerField
            imageUrl={currentImageUrl}
            onImageSelected={handleImageSelected}
            onImageCleared={handleImageCleared}
            shape="circle"
            placeholderIcon="user"
            uploading={isUploadingImage}
            size={120}
            disabled={isBusy}
            label="Foto de perfil"
          />

          {/* Campo: Nombre */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre completo</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, focusedField === "name" && styles.inputFocused]}
                  placeholder="Tu nombre"
                  placeholderTextColor="#6B7280"
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => {
                    setFocusedField(null);
                    onBlur();
                  }}
                  onChangeText={onChange}
                  value={value}
                  editable={!isBusy}
                />
              )}
            />
            {errors.name && <Text style={styles.fieldErrorText}>{errors.name.message}</Text>}
          </View>

          {/* Campo: Correo Electrónico (Solo Lectura) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {profileData?.email || user?.email || ""}
              </Text>
            </View>
            <Text style={styles.helperText}>El correo no se puede cambiar.</Text>
          </View>

          {/* Botón Guardar Cambios */}
          <TouchableOpacity
            style={[styles.submitButton, (!isValid || isBusy) && styles.submitButtonDisabled]}
            disabled={!isValid || isBusy}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.8}
          >
            {isBusy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isUploadingImage ? "Subiendo foto..." : "Guardando..."}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5FB",
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerPlaceholder: {
    width: 50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  successBanner: {
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  successText: {
    color: "#15803D",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F7F5FB",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A1A",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: "#6D28D9",
    backgroundColor: "#FFFFFF",
  },
  readOnlyInput: {
    backgroundColor: "#F3F4F6",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  readOnlyText: {
    fontSize: 15,
    color: "#6B7280",
  },
  fieldErrorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#6D28D9",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
