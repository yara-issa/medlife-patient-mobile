import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";
import { sendAppointmentReminder } from "../services/emailjs";

/* ─── date helpers ─── */

function formatTime(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayLabel(iso) {
  if (!iso) return { label: "—", color: null, isSpecial: false };
  const apptDay = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diffMs = apptDay - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", color: "#128C7E", isSpecial: true };
  if (diffDays === 1) return { label: "Tomorrow", color: "#e74c3c", isSpecial: true };
  if (diffDays === 2) return { label: "In 2 days", color: "#f39c12", isSpecial: false };
  if (diffDays > 2) return { label: `In ${diffDays} days`, color: null, isSpecial: false };
  if (diffDays === -1) return { label: "Yesterday", color: null, isSpecial: false };
  return { label: `${Math.abs(diffDays)} days ago`, color: null, isSpecial: false };
}

function isUpcoming(iso) {
  if (!iso) return false;
  return startOfDay(new Date(iso)) >= startOfDay(new Date());
}

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed" || s === "scheduled") return "#128C7E";
  if (s === "completed" || s === "done") return "#2ecc71";
  if (s === "cancelled" || s === "canceled") return "#e74c3c";
  if (s === "pending") return "#f39c12";
  return "#128C7E";
}

/* ─── component ─── */

export default function ReminderScreen({ navigation }) {
  const { colors } = useTheme();
  const { patient, appointments, loading } = usePatient();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  /* auto email reminders for confirmed appts within 24 h */
  const checkReminders = useCallback(async (appts) => {
    if (!patient?.email) return;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    for (const appt of appts) {
      if (!appt.appointment_time) continue;
      const apptTime = new Date(appt.appointment_time).getTime();
      const diff = apptTime - now;
      const sentKey = "REMINDER_" + appt.id;
      const alreadySent = await AsyncStorage.getItem(sentKey);
      const doctorName = appt.doctor?.full_name || "Doctor";
      if (diff > 0 && diff <= oneDay && appt.status === "confirmed" && !alreadySent) {
        try {
          await sendAppointmentReminder(
            patient.email, patient.full_name, doctorName,
            formatDate(appt.appointment_time), formatTime(appt.appointment_time)
          );
          await AsyncStorage.setItem(sentKey, "1");
        } catch (err) {
          console.log("Reminder error:", err);
        }
      }
    }
  }, [patient?.email, patient?.full_name]);

  useEffect(() => {
    if (appointments.length > 0) checkReminders(appointments);
  }, [appointments, checkReminders]);

  const upcoming = appointments.filter((a) => isUpcoming(a.appointment_time));
  const past = appointments.filter((a) => !isUpcoming(a.appointment_time));

  /* ─── sub-components ─── */

  const SectionLabel = ({ title, count, icon }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
        </View>
      )}
    </View>
  );

  const AppointmentCard = ({ a }) => {
    const doctorName = a.doctor?.full_name || null;
    const statusCol = statusColor(a.status);
    const { label: dayLabel, color: dayColor, isSpecial } = getDayLabel(a.appointment_time);
    const finalDayColor = dayColor || colors.mutedForeground;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: statusCol }]}>
        {/* top row */}
        <View style={styles.cardTop}>
          <View style={[styles.iconCircle, { backgroundColor: statusCol + "22" }]}>
            <Ionicons name="person-circle-outline" size={22} color={statusCol} />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.docName, { color: colors.foreground }]}>
              {doctorName ? "Dr. " + doctorName : "Appointment"}
            </Text>
            {a.reason ? (
              <Text style={[styles.reason, { color: colors.mutedForeground }]} numberOfLines={2}>
                {a.reason}
              </Text>
            ) : null}
          </View>

          {/* status badge + day countdown stacked */}
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            {a.status ? (
              <View style={[styles.badge, { backgroundColor: statusCol + "22" }]}>
                <Text style={[styles.badgeText, { color: statusCol }]}>
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </Text>
              </View>
            ) : null}
            <View style={[
              styles.dayPill,
              {
                backgroundColor: isSpecial ? finalDayColor + "22" : colors.secondary,
                borderColor: isSpecial ? finalDayColor + "55" : colors.border,
              },
            ]}>
              <Text style={[
                styles.dayPillText,
                { color: isSpecial ? finalDayColor : colors.mutedForeground, fontWeight: isSpecial ? "800" : "600" },
              ]}>
                {dayLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* date / time row */}
        <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {formatDate(a.appointment_time)}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time" size={14} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {formatTime(a.appointment_time)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /* ─── render ─── */

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>Appointments</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.liveChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>Live</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 30 }]}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Loading...</Text>
          </View>
        )}

        {!loading && appointments.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={50} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No appointments yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Your scheduled visits will appear here
            </Text>
          </View>
        )}

        {!loading && upcoming.length > 0 && (
          <>
            <SectionLabel title="Upcoming" count={upcoming.length} icon="calendar" />
            {upcoming.map((a) => <AppointmentCard key={a.id} a={a} />)}
          </>
        )}

        {!loading && past.length > 0 && (
          <>
            <SectionLabel title="Past" count={past.length} icon="time-outline" />
            {past.map((a) => <AppointmentCard key={a.id} a={a} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 10 },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: "700" },

  content: { padding: 16 },
  center: { marginTop: 80, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: "700" },

  card: {
    borderRadius: 14, marginBottom: 12, borderLeftWidth: 4, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", padding: 14, paddingBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  docName: { fontSize: 15, fontWeight: "700" },
  reason: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },

  dateRow: {
    flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
  },
  dateItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateText: { fontSize: 13, fontWeight: "500" },

  dayPill: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, marginLeft: "auto",
  },
  dayPillText: { fontSize: 12 },
});
