import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from "../content/terms";

export function TermsContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TÉRMINOS Y CONDICIONES DE USO</Text>
      <Text style={styles.appName}>EMPRENDO</Text>
      <Text style={styles.lastUpdated}>Última actualización: {TERMS_LAST_UPDATED}</Text>

      <View style={styles.sectionsContainer}>
        {TERMS_SECTIONS.map((section) => (
          <View key={section.id} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.content}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6D28D9",
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionsContainer: {
    gap: 16,
  },
  sectionBlock: {
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6D28D9",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 23,
    color: "#1A1A1A",
  },
});
