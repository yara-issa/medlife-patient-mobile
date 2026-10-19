import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";
import TopBar from "../components/TopBar";

export default function ClinicalNotesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { notes, loading } = usePatient();
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <View style={styles.pageHeading}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Clinical Notes</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Doctor observations & updates</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
        {!loading && notes.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No clinical notes on record</Text>
          </View>
        )}
        {notes.map((n) => (
          <View key={n.id} style={[styles.card, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <View style={styles.row}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.noteText, { color: colors.foreground }]}>{n.note_text}</Text>
            </View>
            {n.visit_date ? (
              <Text style={[styles.date, { color: colors.mutedForeground }]}>
                {new Date(n.visit_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
  card: { padding: 18, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noteText: { fontSize: 15, fontWeight: "600", lineHeight: 22, flex: 1 },
  date: { marginTop: 10, marginLeft: 30, fontSize: 11 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
