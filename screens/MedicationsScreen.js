import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";
import TopBar from "../components/TopBar";

export default function MedicationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { medications, loading } = usePatient();
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <View style={styles.pageHeading}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Medications</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Doctor instructions feed</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
        {!loading && medications.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="medkit-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No medications on record</Text>
          </View>
        )}
        {medications.map((m) => (
          <View key={m.id} style={[styles.card, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <View style={styles.row}>
              <Ionicons name="medkit" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.medName, { color: colors.foreground }]}>
                  {m.name}{m.dosage ? " • " + m.dosage : ""}
                </Text>
                {m.frequency ? <Text style={[styles.freq, { color: colors.mutedForeground }]}>{m.frequency}</Text> : null}
              </View>
            </View>
            {m.doctor?.full_name ? (
              <Text style={[styles.doctor, { color: colors.primary }]}>By: {m.doctor.full_name}</Text>
            ) : null}
            {m.created_at ? (
              <Text style={[styles.date, { color: colors.mutedForeground }]}>
                {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
            ) : null}
          </View>
        ))}
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
  card: {
    padding: 18, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  medName: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  freq: { fontSize: 13, marginTop: 3 },
  doctor: { fontSize: 12, marginTop: 6, marginLeft: 30 },
  date: { fontSize: 11, marginTop: 4, marginLeft: 30 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
