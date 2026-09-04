import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart } from "react-native-chart-kit";
import { documentDirectory, writeAsStringAsync, EncodingType } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { reportsApi } from "../../../lib/reports.api";
import { Feather } from "@expo/vector-icons";
import { queryKeys } from "../../../lib/queryKeys";
import { useRefetchOnFocus } from "../../../hooks/useRefetchOnFocus";

const screenWidth = Dimensions.get("window").width;

// Helper para calcular fechas basadas en presets
const getPresetDates = (preset: string) => {
  const now = new Date();
  let from = new Date();
  let to = new Date();

  switch (preset) {
    case "Hoy":
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case "Esta semana":
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      from = new Date(now.setDate(diff));
      from.setHours(0, 0, 0, 0);
      to = new Date();
      to.setHours(23, 59, 59, 999);
      break;
    case "Este mes":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      to = new Date();
      to.setHours(23, 59, 59, 999);
      break;
    case "Este año":
      from = new Date(now.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
  }
  return { from, to };
};

// Formateador para las etiquetas del gráfico
const formatPeriodLabel = (isoStr: string, groupBy: "day" | "month" | "year") => {
  const d = new Date(isoStr);
  if (groupBy === "day") {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } else if (groupBy === "month") {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return months[d.getMonth()];
  } else {
    return `${d.getFullYear()}`;
  }
};

export default function ReportsDashboard() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const [preset, setPreset] = useState("Este mes");
  const [customFrom, setCustomFrom] = useState(new Date());
  const [customTo, setCustomTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Resolver rango de fechas a enviar
  let fromDate = new Date();
  let toDate = new Date();
  if (preset === "Personalizado") {
    fromDate = new Date(customFrom.setHours(0, 0, 0, 0));
    toDate = new Date(customTo.setHours(23, 59, 59, 999));
  } else {
    const dates = getPresetDates(preset);
    fromDate = dates.from;
    toDate = dates.to;
  }

  const fromParam = fromDate.toISOString();
  const toParam = toDate.toISOString();

  // Inferir groupBy en función del rango
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const groupBy: "day" | "month" | "year" = diffDays <= 31 ? "day" : diffDays <= 366 ? "month" : "year";

  // Queries
  const { data: utilidad, isLoading: isLoadingUtilidad, refetch: refetchUtilidad } = useQuery({
    queryKey: queryKeys.reports.utilidad({ from: fromParam, to: toParam }),
    queryFn: () => reportsApi.getUtilidad({ from: fromParam, to: toParam }),
  });

  const { data: comparativo, isLoading: isLoadingComparativo, refetch: refetchComparativo } = useQuery({
    queryKey: queryKeys.reports.comparativo({ from: fromParam, to: toParam, groupBy }),
    queryFn: () => reportsApi.getComparativo({ from: fromParam, to: toParam, groupBy }),
  });

  const { data: topProducts, isLoading: isLoadingTop, refetch: refetchTop } = useQuery({
    queryKey: queryKeys.reports.topProductos({ from: fromParam, to: toParam, limit: 5, orderBy: "revenue" }),
    queryFn: () => reportsApi.getTopProductos({ from: fromParam, to: toParam, limit: 5, orderBy: "revenue" }),
  });

  useRefetchOnFocus(refetchUtilidad);
  useRefetchOnFocus(refetchComparativo);
  useRefetchOnFocus(refetchTop);

  // Handler de exportación a Excel
  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const base64 = await reportsApi.exportReport(fromParam, toParam);
      
      const sanitizedFrom = fromParam.replace(/:/g, "-");
      const sanitizedTo = toParam.replace(/:/g, "-");
      const fileUri = `${documentDirectory}reporte-emprendo-${sanitizedFrom}-a-${sanitizedTo}.xlsx`;

      await writeAsStringAsync(fileUri, base64, { encoding: EncodingType.Base64 });

      // Abrir diálogo nativo para compartir/guardar el archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Reporte de Emprendo",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
      }
    } catch (err) {
      console.error("Error al exportar reporte:", err);
      setExportError("Ocurrió un error al generar y compartir el archivo de Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // Validar si existen datos para graficar
  const hasChartData =
    comparativo &&
    comparativo.length > 0 &&
    comparativo.some((c) => c.ventas > 0 || c.gastos > 0);

  const presets = ["Hoy", "Esta semana", "Este mes", "Este año", "Personalizado"];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()} activeOpacity={0.7}>
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
        <TouchableOpacity
          style={styles.exportHeaderBtn}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#6D28D9" />
          ) : (
            <Text style={styles.exportHeaderBtnText}>Excel</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {exportError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{exportError}</Text>
          </View>
        )}

        {/* Chips de Presets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsContainer}
        >
          {presets.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.presetChip, preset === p && styles.presetChipActive]}
              onPress={() => {
                setPreset(p);
                setExportError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetChipText, preset === p && styles.presetChipTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selector Personalizado */}
        {preset === "Personalizado" && (
          <View style={styles.customDateContainer}>
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={styles.customDateBtn}
                onPress={() => setShowFromPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.customDateBtnLabel}>Desde</Text>
                <Text style={styles.customDateBtnValue}>
                  {customFrom.toLocaleDateString("es-ES")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customDateBtn}
                onPress={() => setShowToPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.customDateBtnLabel}>Hasta</Text>
                <Text style={styles.customDateBtnValue}>
                  {customTo.toLocaleDateString("es-ES")}
                </Text>
              </TouchableOpacity>
            </View>

            {showFromPicker && (
              <DateTimePicker
                value={customFrom}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowFromPicker(false);
                  if (date) {
                    setCustomFrom(date);
                    if (customTo < date) setCustomTo(date);
                  }
                }}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={customTo}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowToPicker(false);
                  if (date) {
                    if (date >= customFrom) setCustomTo(date);
                  }
                }}
              />
            )}
          </View>
        )}

        {/* 1. Tarjeta de Utilidad */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de Utilidad</Text>
          {isLoadingUtilidad || !utilidad ? (
            <ActivityIndicator size="small" color="#6D28D9" style={styles.spinner} />
          ) : (
            <View>
              <View style={styles.netaContainer}>
                <Text style={styles.netaLabel}>Utilidad Neta</Text>
                <Text
                  style={[
                    styles.netaValue,
                    utilidad.utilidad >= 0 ? styles.positiveText : styles.negativeText,
                  ]}
                >
                  {utilidad.utilidad >= 0 ? "" : "-"}${Math.abs(utilidad.utilidad).toFixed(2)}
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.rowMetric}>
                <Text style={styles.metricLabel}>(+) Ingresos Totales</Text>
                <Text style={styles.metricVal}>${utilidad.ingresos.toFixed(2)}</Text>
              </View>

              <View style={styles.rowMetric}>
                <Text style={styles.metricLabel}>(-) Gastos Operativos</Text>
                <Text style={styles.metricVal}>${utilidad.gastos.toFixed(2)}</Text>
              </View>

              <View style={styles.rowMetricRef}>
                <Text style={styles.metricLabelRef}>(ℹ️) Margen Bruto (referencial)</Text>
                <Text style={styles.metricValRef}>
                  ${(utilidad.margenBrutoReferencial ?? utilidad.costoVenta).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.metricRefSubtext}>
                Este costo base es solo informativo y no se descuenta automáticamente de la utilidad (Ingresos - Gastos).
              </Text>
            </View>
          )}
        </View>

        {/* 2. Gráfico Ventas vs Gastos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ventas vs Gastos por Periodo</Text>
          {isLoadingComparativo ? (
            <ActivityIndicator size="small" color="#6D28D9" style={styles.spinner} />
          ) : !hasChartData ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay movimientos de venta ni gastos en el periodo seleccionado.
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: (comparativo || []).map((c) => formatPeriodLabel(c.period, groupBy)),
                  datasets: [
                    {
                      data: (comparativo || []).map((c) => c.ventas),
                      color: (opacity = 1) => `rgba(109, 40, 217, ${opacity})`, // Violeta
                      strokeWidth: 2,
                    },
                    {
                      data: (comparativo || []).map((c) => c.gastos),
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Rojo
                      strokeWidth: 2,
                    },
                  ],
                  legend: ["Ventas", "Gastos"],
                }}
                width={screenWidth - 72}
                height={200}
                yAxisLabel="$"
                chartConfig={{
                  backgroundColor: "#F7F5FB",
                  backgroundGradientFrom: "#F7F5FB",
                  backgroundGradientTo: "#F7F5FB",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(109, 40, 217, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#6D28D9",
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}
        </View>

        {/* 3. Top Productos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Productos Más Vendidos</Text>
          {isLoadingTop ? (
            <ActivityIndicator size="small" color="#6D28D9" style={styles.spinner} />
          ) : !topProducts || topProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay productos vendidos en este periodo.
              </Text>
            </View>
          ) : (
            <View style={styles.topList}>
              {topProducts.map((item, index) => (
                <View key={item.productId} style={styles.topRow}>
                  <View style={styles.topRankContainer}>
                    <Text style={styles.topRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topInfo}>
                    <Text style={styles.topName} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={styles.topSub}>
                      {item.totalQuantity} {item.totalQuantity === 1 ? "unidad vendida" : "unidades vendidas"}
                    </Text>
                  </View>
                  <Text style={styles.topRev}>${item.totalRevenue.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botón Principal Exportar Excel */}
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.exportButtonText}>Exportar Reporte a Excel</Text>
          )}
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5FB",
  },
  menuButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  exportHeaderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exportHeaderBtnText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "600",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  presetsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F7F5FB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  presetChipActive: {
    backgroundColor: "#6D28D9",
  },
  presetChipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  presetChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  customDateContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  datePickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  customDateBtn: {
    flex: 1,
    backgroundColor: "#F7F5FB",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  customDateBtnLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  customDateBtnValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  card: {
    backgroundColor: "#F7F5FB",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    marginBottom: 14,
  },
  spinner: {
    marginVertical: 12,
  },
  netaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  netaLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  netaValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  positiveText: {
    color: "#10B981", // verde
  },
  negativeText: {
    color: "#DC2626", // rojo/error
  },
  metricDivider: {
    height: 1,
    backgroundColor: "#EAE5F5",
    marginVertical: 12,
  },
  rowMetric: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  metricVal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  rowMetricRef: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F7F5FB",
  },
  metricLabelRef: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricValRef: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  metricRefSubtext: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    lineHeight: 14,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  chartWrapper: {
    alignItems: "center",
    marginTop: 4,
  },
  chart: {
    borderRadius: 12,
  },
  topList: {
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  topRankContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  topRankText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  topInfo: {
    flex: 1,
    marginRight: 10,
  },
  topName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  topSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  topRev: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  exportButton: {
    backgroundColor: "#6D28D9",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
