import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";
import TopBar from "../components/TopBar";

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "normal") return "#2ecc71";
  if (s === "final") return "#128C7E";
  if (s === "review" || s === "alert") return "#f39c12";
  if (s === "critical") return "#e74c3c";
  return "#128C7E";
}

function isUrl(val) {
  return typeof val === "string" &&
    (val.startsWith("http://") || val.startsWith("https://"));
}

function fileIcon(url) {
  if (!url) return "document-outline";
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "document-text-outline";
  if (lower.includes(".ppt")) return "easel-outline";
  if (lower.includes(".xls") || lower.includes(".xlsx")) return "grid-outline";
  if (lower.includes(".jpg") || lower.includes(".png")) return "image-outline";
  return "attach-outline";
}

function fileLabel(url) {
  if (!url) return "View File";
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "View PDF";
  if (lower.includes(".ppt")) return "View Presentation";
  if (lower.includes(".xls") || lower.includes(".xlsx")) return "View Spreadsheet";
  if (lower.includes(".jpg") || lower.includes(".png")) return "View Image";
  return "View File";
}

async function openFile(url) {
  if (Platform.OS === "web") {
    window.open(url, "_blank");
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert("Cannot Open", "Unable to open this file.");
  }
}

function getViewerUrl(url) {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
}

export default function LabResultsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { labResults, loading } = usePatient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />

      <View style={styles.pageHeading}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Lab Results</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          {labResults.length > 0
            ? `${labResults.length} report(s) on file`
            : "Clinical diagnostic reports"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        )}

        {!loading && labResults.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="flask-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No lab results on record
            </Text>
          </View>
        )}

        {labResults.map((r) => {
          const hasFile = isUrl(r.result_value);
          const color = statusColor(r.status);

          return (
            <View
              key={r.id}
              style={[styles.card, { backgroundColor: colors.card, borderLeftColor: color }]}
            >
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: color + "22" }]}>
                  <Ionicons name="flask" size={18} color={color} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.testName, { color: colors.foreground }]}>{r.test_name}</Text>
                  {r.test_date ? (
                    <Text style={[styles.date, { color: colors.mutedForeground }]}>
                      {new Date(r.test_date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  ) : null}
                </View>
                {r.status ? (
                  <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.badgeText, { color }]}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {hasFile ? (
                <TouchableOpacity
                  style={[styles.fileBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => setPreviewUrl(r.result_value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={fileIcon(r.result_value)} size={18} color={colors.primary} />
                  <Text style={[styles.fileBtnText, { color: colors.primary }]}>
                    {fileLabel(r.result_value)}
                  </Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={16}
                    color={colors.primary}
                    style={{ marginLeft: "auto" }}
                  />
                </TouchableOpacity>
              ) : r.result_value ? (
                <Text style={[styles.resultValue, { color }]}>{r.result_value}</Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!previewUrl} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalTop}>
            <TouchableOpacity onPress={() => setPreviewUrl(null)}>
              <Text style={styles.modalBtn}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const url = previewUrl;
                setPreviewUrl(null);
                openFile(url);
              }}
            >
              <Text style={[styles.modalBtn, { color: "#2ecc71" }]}>Open External</Text>
            </TouchableOpacity>
          </View>
          {previewUrl ? (
            <WebView source={{ uri: getViewerUrl(previewUrl) }} style={{ flex: 1 }} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeading: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800" },
  pageSubtitle: { fontSize: 12, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 14 },
  card: {
    padding: 16, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  testName: { fontSize: 15, fontWeight: "700" },
  date: { fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  fileBtn: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1,
  },
  fileBtnText: { fontSize: 13, fontWeight: "600", flex: 1, marginLeft: 8 },
  resultValue: { fontSize: 13, fontWeight: "600", marginTop: 4, paddingLeft: 4 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  modal: { flex: 1, backgroundColor: "#000" },
  modalTop: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  modalBtn: { color: "white", fontSize: 14 },
});
