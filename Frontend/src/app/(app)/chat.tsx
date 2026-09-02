import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi, ChatMessageItem, ChatSessionItem } from "../../lib/ai.api";
import { queryKeys } from "../../lib/queryKeys";

const SUGGESTED_PROMPTS = [
  "¿Cuánto vendí este mes?",
  "¿Tengo productos agotándose?",
  "¿Cuál fue mi ganancia neta?",
  "¿Cuáles son mis productos más vendidos?",
];

export default function ChatScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Consulta de lista de sesiones para el modal de historial
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: queryKeys.ai.sessions,
    queryFn: () => aiApi.listChatSessions(),
    enabled: isHistoryModalOpen,
  });

  // Mutación para enviar mensaje
  const sendMutation = useMutation({
    mutationFn: ({ activeSessionId, text }: { activeSessionId?: string; text: string }) =>
      aiApi.sendChatMessage(activeSessionId, text),
    onSuccess: (data) => {
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
      // Reemplaza el mensaje temporal de carga por el mensaje real del asistente
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== "temp_loading")
          .concat({
            id: `asst_${Date.now()}`,
            role: "assistant",
            content: data.message.content,
            createdAt: new Date().toISOString(),
          })
      );
      // Invalida la lista de sesiones
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.sessions });
    },
    onError: (error: any) => {
      console.error("Error enviando mensaje a IA:", error);
      // Reemplaza el mensaje temporal por un mensaje de error
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== "temp_loading")
          .concat({
            id: `err_${Date.now()}`,
            role: "assistant",
            content: "No pude procesar tu mensaje en este momento. Intenta de nuevo.",
            createdAt: new Date().toISOString(),
          })
      );
    },
  });

  // Mutación para cargar una sesión pasada del historial
  const loadSessionMutation = useMutation({
    mutationFn: (targetSessionId: string) => aiApi.getSessionMessages(targetSessionId),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages(data.messages);
      setIsHistoryModalOpen(false);
    },
    onError: (error) => {
      console.error("Error al cargar sesión de chat:", error);
    },
  });

  // Auto-scroll al final de la lista al recibir o agregar mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || sendMutation.isPending) return;

    setInputText("");

    // Agregar optimistamente el mensaje del usuario y la burbuja de carga
    const userMsg: ChatMessageItem = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const loadingMsg: ChatMessageItem = {
      id: "temp_loading",
      role: "assistant",
      content: "Analizando datos de tu negocio...",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    sendMutation.mutate({
      activeSessionId: sessionId || undefined,
      text,
    });
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInputText("");
  };

  const handleSelectSession = (selectedSessionId: string) => {
    loadSessionMutation.mutate(selectedSessionId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Asistente Emprendo</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsHistoryModalOpen(true)}
            activeOpacity={0.7}
          >
            <Feather name="clock" size={20} color="#6D28D9" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Feather name="plus-circle" size={20} color="#6D28D9" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {messages.length === 0 ? (
          /* Estado Vacío / Pantalla de Bienvenida */
          <ScrollView
            contentContainerStyle={styles.welcomeContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.iconCircle}>
              <Feather name="zap" size={32} color="#6D28D9" />
            </View>
            <Text style={styles.welcomeTitle}>Pregúntame sobre tu negocio</Text>
            <Text style={styles.welcomeSubtitle}>
              Puedo consultar tus ventas, inventarios, productos con bajo stock y utilidades en tiempo real.
            </Text>

            <View style={styles.chipsContainer}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.promptChip}
                  onPress={() => handleSend(prompt)}
                  activeOpacity={0.7}
                >
                  <Feather name="message-square" size={14} color="#6D28D9" style={{ marginRight: 6 }} />
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* Lista de Mensajes */
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `msg_${index}`}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const isUser = item.role === "user";
              const isLoading = item.id === "temp_loading";

              return (
                <View
                  style={[
                    styles.messageWrapper,
                    isUser ? styles.userWrapper : styles.assistantWrapper,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.botAvatar}>
                      <Feather name="zap" size={12} color="#6D28D9" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {isLoading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#6D28D9" style={{ marginRight: 8 }} />
                        <Text style={styles.loadingText}>{item.content}</Text>
                      </View>
                    ) : (
                      <Text style={isUser ? styles.userText : styles.assistantText}>
                        {item.content}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Fijo Inferior */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe tu consulta..."
            placeholderTextColor="#6B7280"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            editable={!sendMutation.isPending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sendMutation.isPending) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || sendMutation.isPending}
            activeOpacity={0.8}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Historial de Sesiones */}
      <Modal
        visible={isHistoryModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial de Conversaciones</Text>
              <TouchableOpacity
                onPress={() => setIsHistoryModalOpen(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {isLoadingSessions || loadSessionMutation.isPending ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator size="large" color="#6D28D9" />
              </View>
            ) : !sessions || sessions.length === 0 ? (
              <View style={styles.modalCenter}>
                <Text style={styles.emptySessionsText}>No tienes conversaciones anteriores.</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.sessionList}
                renderItem={({ item }) => {
                  const isSelected = item.id === sessionId;
                  const dateStr = new Date(item.updatedAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <TouchableOpacity
                      style={[styles.sessionCard, isSelected && styles.sessionCardActive]}
                      onPress={() => handleSelectSession(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sessionCardInfo}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.sessionDate}>{dateStr}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={isSelected ? "#6D28D9" : "#6B7280"} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
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
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  welcomeContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F7F5FB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  chipsContainer: {
    width: "100%",
    gap: 10,
  },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  promptChipText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  userWrapper: {
    justifyContent: "flex-end",
  },
  assistantWrapper: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F7F5FB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#6D28D9",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#F7F5FB",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  userText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  assistantText: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6D28D9",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F7F5FB",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F7F5FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    fontSize: 15,
    color: "#1A1A1A",
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5FB",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCenter: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySessionsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  sessionList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F5FB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  sessionCardActive: {
    borderColor: "#6D28D9",
    backgroundColor: "#F3EFFC",
  },
  sessionCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: "#6B7280",
  },
});
