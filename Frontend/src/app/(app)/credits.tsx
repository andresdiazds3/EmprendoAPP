import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { CREDITS } from "../../content/credits";

export default function CreditsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera con menú lateral */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créditos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Ícono de proyecto */}
        <View style={styles.iconCircle}>
          <Feather name="award" size={32} color="#6D28D9" />
        </View>

        {/* Nombre de la app y subtítulo */}
        <Text style={styles.appName}>{CREDITS.appName}</Text>
        <Text style={styles.subtitle}>{CREDITS.subtitle}</Text>

        {/* Tarjeta con los datos de crédito */}
        <View style={styles.card}>
          {CREDITS.items.map((item, index) => (
            <View key={index} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Pie de página institucional */}
        <Text style={styles.footerNote}>
          Sistema Integral de Gestión Comercial y Financiera para Emprendedores
        </Text>
      </ScrollView>
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
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5FB",
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  placeholder: {
    width: 40,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F7F5FB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#EAE5F5",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6D28D9",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#F7F5FB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAE5F5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 32,
  },
  itemRow: {
    paddingVertical: 14,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#EAE5F5",
  },
  itemLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemValue: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});
