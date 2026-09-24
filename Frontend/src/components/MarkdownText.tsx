import React from "react";
import { View, Text, StyleSheet, TextStyle, StyleProp, Platform, Image } from "react-native";

interface MarkdownTextProps {
  content: string;
  baseStyle?: StyleProp<TextStyle>;
  isUser?: boolean;
}

// Parsea texto enriquecido inline: **negrita**, *cursiva*, `código`
function parseInline(text: string, baseStyle: StyleProp<TextStyle>, isUser: boolean) {
  // Tokenizador para capturar **bold**, __bold__, *italic*, _italic_, `code`
  const regex = /(\*\*[\s\S]*?\*\*|__[\s\S]*?__|(?<!\*)\*(?!\*)[\s\S]*?(?<!\*)\*(?!\*)|(?<!_)_(?!_)[\s\S]*?(?<!_)_(?!_)|`[\s\S]*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Negrita: **texto** o __texto__
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            styles.bold,
            isUser ? styles.userBold : styles.assistantBold,
          ]}
        >
          {inner}
        </Text>
      );
    }

    // Cursiva: *texto* o _texto_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2 && !part.startsWith("__"))
    ) {
      const inner = part.slice(1, -1);
      return (
        <Text key={index} style={[baseStyle, styles.italic]}>
          {inner}
        </Text>
      );
    }

    // Código en línea: `texto`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            styles.inlineCode,
            isUser ? styles.userCode : styles.assistantCode,
          ]}
        >
          {inner}
        </Text>
      );
    }

    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({
  content,
  baseStyle,
  isUser = false,
}) => {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <View style={styles.container}>
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();

        // Línea vacía
        if (!trimmed) {
          return <View key={lineIndex} style={styles.emptyLine} />;
        }

        // Encabezados (### Titular)
        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s+/, "");
          return (
            <View key={lineIndex} style={styles.headingBlock}>
              <Text style={[baseStyle, styles.h3, isUser ? styles.userBold : styles.assistantBold]}>
                {parseInline(headingText, [baseStyle, styles.h3], isUser)}
              </Text>
            </View>
          );
        }

        // Encabezados (## Titular)
        if (trimmed.startsWith("## ")) {
          const headingText = trimmed.replace(/^##\s+/, "");
          return (
            <View key={lineIndex} style={styles.headingBlock}>
              <Text style={[baseStyle, styles.h2, isUser ? styles.userBold : styles.assistantBold]}>
                {parseInline(headingText, [baseStyle, styles.h2], isUser)}
              </Text>
            </View>
          );
        }

        // Encabezados (# Titular)
        if (trimmed.startsWith("# ")) {
          const headingText = trimmed.replace(/^#\s+/, "");
          return (
            <View key={lineIndex} style={styles.headingBlock}>
              <Text style={[baseStyle, styles.h1, isUser ? styles.userBold : styles.assistantBold]}>
                {parseInline(headingText, [baseStyle, styles.h1], isUser)}
              </Text>
            </View>
          );
        }

        // Listas con viñetas (- item o * item)
        if (trimmed.startsWith("- ") || (trimmed.startsWith("* ") && !trimmed.startsWith("** "))) {
          const bulletText = trimmed.substring(2);
          return (
            <View key={lineIndex} style={styles.bulletRow}>
              <Text style={[baseStyle, styles.bulletDot, isUser && styles.userText]}>•</Text>
              <Text style={[baseStyle, styles.bulletContent]}>
                {parseInline(bulletText, baseStyle, isUser)}
              </Text>
            </View>
          );
        }

        // Listas numeradas (1. item, 2. item)
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          const num = numberedMatch[1];
          const itemText = numberedMatch[2];
          return (
            <View key={lineIndex} style={styles.bulletRow}>
              <Text style={[baseStyle, styles.numberedText, isUser && styles.userText]}>{num}.</Text>
              <Text style={[baseStyle, styles.bulletContent]}>
                {parseInline(itemText, baseStyle, isUser)}
              </Text>
            </View>
          );
        }

        // Imágenes (![alt](url))
        const imageMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
        if (imageMatch) {
          const alt = imageMatch[1];
          const url = imageMatch[2];
          return (
            <View key={lineIndex} style={styles.imageContainer}>
              <Image
                source={{ uri: url }}
                style={styles.image}
                resizeMode="cover"
              />
              {alt ? <Text style={styles.imageCaption}>{alt}</Text> : null}
            </View>
          );
        }

        // Párrafo normal
        return (
          <Text key={lineIndex} style={[baseStyle, styles.paragraphLine]}>
            {parseInline(line, baseStyle, isUser)}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  emptyLine: {
    height: 6,
  },
  paragraphLine: {
    lineHeight: 22,
    marginBottom: 2,
  },
  bold: {
    fontWeight: "700",
  },
  assistantBold: {
    color: "#111827",
    fontWeight: "700",
  },
  userBold: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  inlineCode: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  assistantCode: {
    backgroundColor: "#F3F4F6",
    color: "#6D28D9",
  },
  userCode: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "#FFFFFF",
  },
  headingBlock: {
    marginTop: 6,
    marginBottom: 4,
  },
  h1: {
    fontSize: 17,
    fontWeight: "bold",
    lineHeight: 23,
  },
  h2: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 22,
  },
  h3: {
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 14,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  numberedText: {
    width: 20,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    color: "#6D28D9",
  },
  bulletContent: {
    flex: 1,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  imageContainer: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EAE5F5",
    width: "100%",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    paddingTop: 6,
    paddingBottom: 4,
    fontStyle: "italic",
  },
});
