import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";
import TopBar from "../components/TopBar";

function sevColor(sev) {
  const s = (sev ?? "").toLowerCase();
  if (s === "severe" || s === "high") return "#e74c3c";
  if (s === "moderate" || s === "medium") return "#f39c12";
  return "#2ecc71";
}

export default function AllergiesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { allergies, loading } = usePatient();
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <View style={styles.pageHeading}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Allergies</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Known patient sensitivities</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
        {!loading && allergies.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#2ecc71" />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No known allergies</Text>
          </View>
        )}
        {allergies.map((a) => {
          const color = sevColor(a.severity);
          return (
            <View key={a.id} style={[styles.card, { backgroundColor: colors.card, borderLeftColor: color }]}>
              <View style={styles.row}>
                <Ionicons name="warning" size={20} color={color} />
                <Text style={[styles.allergen, { color: colors.foreground }]}>{a.allergen}</Text>
              </View>
              {a.severity ? (
                <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.badgeText, { color }]}>
                    {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeading: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800" },
  pageSubtitle: { fontSize: 12, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 14 },
  card: { padding: 18, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  allergen: { fontSize: 16, fontWeight: "600", flex: 1 },
  badge: { marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
