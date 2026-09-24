import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

export interface ImagePickerFieldProps {
  imageUrl?: string | null;
  onImageSelected: (localUri: string) => void;
  onImageCleared: () => void;
  shape?: "square" | "circle";
  placeholderIcon?: keyof typeof Feather.glyphMap;
  uploading?: boolean;
  size?: number;
  disabled?: boolean;
  label?: string;
}

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  imageUrl,
  onImageSelected,
  onImageCleared,
  shape = "square",
  placeholderIcon = "image",
  uploading = false,
  size = 110,
  disabled = false,
  label,
}) => {
  const isCircle = shape === "circle";
  const borderRadius = isCircle ? size / 2 : 14;

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permiso de cámara requerido",
          "Para tomar fotos, por favor habilita el permiso de cámara desde los ajustes de tu celular."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error al abrir la cámara:", error);
      Alert.alert("Error", "Ocurrió un error al abrir la cámara.");
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permiso de fotos requerido",
          "Para elegir fotos de la galería, por favor habilita el permiso de acceso a fotos desde los ajustes de tu celular."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error al abrir la galería:", error);
      Alert.alert("Error", "Ocurrió un error al abrir la galería.");
    }
  };

  const showOptions = () => {
    if (disabled || uploading) return;

    const hasImage = Boolean(imageUrl);

    if (Platform.OS === "ios") {
      const options = ["Tomar foto", "Elegir de galería"];
      if (hasImage) {
        options.push("Quitar foto");
      }
      options.push("Cancelar");

      const destructiveButtonIndex = hasImage ? 2 : undefined;
      const cancelButtonIndex = options.length - 1;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: "Seleccionar imagen",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleTakePhoto();
          } else if (buttonIndex === 1) {
            handleChooseFromLibrary();
          } else if (hasImage && buttonIndex === 2) {
            onImageCleared();
          }
        }
      );
    } else {
      const buttons: Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }> = [
        { text: "Tomar foto", onPress: handleTakePhoto },
        { text: "Elegir de galería", onPress: handleChooseFromLibrary },
      ];

      if (hasImage) {
        buttons.push({
          text: "Quitar foto",
          onPress: onImageCleared,
          style: "destructive",
        });
      }

      buttons.push({ text: "Cancelar", style: "cancel" });

      Alert.alert("Seleccionar imagen", "¿Cómo deseas agregar la foto?", buttons);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.pickerBox,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
        onPress={showOptions}
        activeOpacity={0.8}
        disabled={disabled || uploading}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: size,
                height: size,
                borderRadius,
              },
            ]}
          >
            <Feather name={placeholderIcon} size={size * 0.35} color="#6B7280" />
            <Text style={styles.placeholderText}>Agregar foto</Text>
          </View>
        )}

        {/* Badge con ícono de cámara en la esquina inferior */}
        <View style={[styles.badge, isCircle && styles.badgeCircle]}>
          <Feather name="camera" size={14} color="#FFFFFF" />
        </View>

        {/* Overlay mientras se sube */}
        {uploading && (
          <View style={[styles.uploadingOverlay, { borderRadius }]}>
            <ActivityIndicator size="small" color="#6D28D9" />
            <Text style={styles.uploadingText}>Subiendo...</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  pickerBox: {
    backgroundColor: "#F7F5FB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },
  image: {
    backgroundColor: "#E5E7EB",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
  },
  placeholderText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 4,
  },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#6D28D9",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeCircle: {
    bottom: 2,
    right: 2,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  uploadingText: {
    fontSize: 11,
    color: "#6D28D9",
    fontWeight: "600",
    marginTop: 4,
  },
});
