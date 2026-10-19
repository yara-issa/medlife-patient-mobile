import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Animated, ActivityIndicator, Platform, useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";
import TopBar from "../components/TopBar";

function calcAge(birthday) {
  if (!birthday) return "--";
  return Math.floor((Date.now() - new Date(birthday).getTime()) / 31557600000).toString();
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isUrl(val) {
  return typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));
}

function getRegYear(createdAt) {
  if (!createdAt) return null;
  const y = new Date(createdAt).getFullYear();
  return isNaN(y) ? null : y.toString();
}

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { patient, patientDetails: d, medications, notes, labResults, allergies, profileImage, loading } = usePatient();
  const [cardStatus, setCardStatus] = useState("idle");
  const progress = useRef(new Animated.Value(0)).current;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const pad = width * 0.04;
  const avatarSize = Math.round(width * 0.14);
  const cardHeight = Math.round(width * 0.52);
  const cardIdSize = Math.round(width * 0.075);
  const watermarkSize = Math.round(width * 0.38);
  const vitalW = (width - pad * 2 - 10) / 2;

  if (loading || !patient) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>Loading your records...</Text>
        </View>
      </View>
    );
  }

  const age = calcAge(d?.birthday);
  const initials = getInitials(patient.full_name);
  const location = d?.city ?? d?.address ?? null;
  const regYear = getRegYear(patient.created_at);

  const requestCard = () => {
    if (cardStatus !== "idle") return;
    setCardStatus("pending");
    Animated.timing(progress, { toValue: 0.35, duration: 1500, useNativeDriver: false }).start();
    setTimeout(() => {
      setCardStatus("processing");
      Animated.timing(progress, { toValue: 0.75, duration: 2000, useNativeDriver: false }).start();
    }, 1500);
    setTimeout(() => {
      setCardStatus("done");
      Animated.timing(progress, { toValue: 1, duration: 800, useNativeDriver: false }).start();
      setTimeout(() => { setCardStatus("idle"); progress.setValue(0); }, 1200);
    }, 3500);
  };

  const getHintText = () => {
    if (cardStatus === "pending") return "Request received...";
    if (cardStatus === "processing") return "Preparing your physical card...";
    if (cardStatus === "done") return "Card requested successfully ✓";
    return "Linked to your medical identity";
  };

  const showProgress = cardStatus !== "idle" && cardStatus !== "done";

  const AvatarWithBadge = () => (
    <View style={{ alignItems: "center" }}>
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
      ) : (
        <View style={[styles.initialsCircle, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.primary }]}>
          <Text style={[styles.initialsText, { fontSize: Math.round(avatarSize * 0.38) }]}>{initials}</Text>
        </View>
      )}
      {regYear ? (
        <View style={[styles.yearBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.yearBadgeText, { fontSize: Math.round(width * 0.025) }]}>{regYear}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView
        contentContainerStyle={[styles.scroll, { padding: pad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER CARD */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, marginBottom: pad, borderRadius: Math.round(width * 0.04) }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.patientName, { color: colors.primary, fontSize: Math.round(width * 0.05) }]}>
              {patient.full_name}
            </Text>
            <Text style={[styles.patientSub, { color: colors.mutedForeground, fontSize: Math.round(width * 0.033) }]}>
              {d?.gender ?? ""}{d?.gender && age !== "--" ? " • " : ""}{age !== "--" ? `${age} yrs` : ""}
            </Text>
            <Text style={[styles.patientMeta, { color: colors.mutedForeground, fontSize: Math.round(width * 0.03) }]}>
              ID #{patient.medlife_id}
            </Text>
            {location ? (
              <View style={[styles.headerLocationRow, { marginTop: 4 }]}>
                <Ionicons name="location-outline" size={Math.round(width * 0.032)} color={colors.mutedForeground} />
                <Text style={[styles.headerLocationText, { color: colors.mutedForeground, fontSize: Math.round(width * 0.03) }]}>{location}</Text>
              </View>
            ) : null}
          </View>
          <AvatarWithBadge />
        </View>

        {/* PHYSICAL CARD */}
        <View style={[styles.physicalCard, {
          height: cardHeight,
          borderRadius: Math.round(width * 0.045),
          marginBottom: pad,
          backgroundColor: isDark ? "#0D3B36" : "#2D6A63",
        }]}>
          <Image
            source={require("../assets/images/logo.png")}
            style={[styles.watermarkLogo, { width: watermarkSize, height: watermarkSize, right: -watermarkSize * 0.1, bottom: -watermarkSize * 0.1 }]}
            resizeMode="contain"
          />
          <View style={styles.cardTop}>
            <Text style={[styles.cardLabel, { fontSize: Math.round(width * 0.028) }]}>MEDLIFE PHYSICAL CARD</Text>
          </View>
          <Text style={[styles.cardId, { fontSize: cardIdSize }]}>{patient.medlife_id}</Text>
          <Text style={[styles.cardHint, { fontSize: Math.round(width * 0.03) }]}>{getHintText()}</Text>
          {showProgress && (
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, {
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              }]} />
            </View>
          )}
          {cardStatus === "idle" && (
            <TouchableOpacity
              style={[styles.cardBtn, {
                paddingVertical: Math.round(width * 0.024),
                paddingHorizontal: Math.round(width * 0.036),
                backgroundColor: isDark ? "#000" : "#fff",
              }]}
              onPress={requestCard}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardBtnText, { fontSize: Math.round(width * 0.034), color: isDark ? "#fff" : "#0B1C1A" }]}>
                Request Physical Card
              </Text>
              <Text style={[styles.cardBtnArrow, { fontSize: Math.round(width * 0.04), color: isDark ? "#fff" : "#0B1C1A" }]}>
                {" →"}
              </Text>
            </TouchableOpacity>
          )}
          {cardStatus === "done" && (
            <View style={styles.statusBadge}><Text style={[styles.statusText, { fontSize: Math.round(width * 0.034) }]}>REQUESTED ✓</Text></View>
          )}
        </View>

        {/* INFO CARD */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, marginBottom: pad, borderRadius: Math.round(width * 0.035) }]}>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={Math.round(width * 0.04)} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground, fontSize: Math.round(width * 0.035) }]}>ID #{patient.medlife_id}</Text>
          </View>
          {d?.phone ? (
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Ionicons name="call-outline" size={Math.round(width * 0.04)} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground, fontSize: Math.round(width * 0.035) }]}>{d.phone}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Ionicons name="location-outline" size={Math.round(width * 0.04)} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground, fontSize: Math.round(width * 0.035) }]}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* VITALS */}
        <Text style={[styles.sectionGroupTitle, { color: colors.foreground, fontSize: Math.round(width * 0.042), marginBottom: pad * 0.6 }]}>Vitals</Text>
        <View style={[styles.vitalsRow, { marginBottom: pad }]}>
          {[
            { icon: "fitness", label: "Weight", value: d?.weight ? `${d.weight} kg` : "--" },
            { icon: "resize", label: "Height", value: d?.height ? `${d.height} cm` : "--" },
            { icon: "water", label: "Blood", value: d?.blood_type ?? "--" },
            { icon: "calendar", label: "Age", value: age !== "--" ? age : "--" },
          ].map(({ icon, label, value }) => (
            <View key={label} style={[styles.vitalCard, { backgroundColor: colors.card, width: vitalW, borderRadius: Math.round(width * 0.032), padding: Math.round(width * 0.03) }]}>
              <Ionicons name={icon} size={Math.round(width * 0.05)} color={colors.primary} />
              <Text style={[styles.vitalValue, { color: colors.foreground, fontSize: Math.round(width * 0.046) }]}>{value}</Text>
              <Text style={[styles.vitalLabel, { color: colors.mutedForeground, fontSize: Math.round(width * 0.03) }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CLINICAL */}
        <Text style={[styles.sectionGroupTitle, { color: colors.foreground, fontSize: Math.round(width * 0.042), marginBottom: pad * 0.6 }]}>Clinical Overview</Text>

        {[
          { icon: "medkit", title: "Medications", data: medications, route: "Medications", render: (m) => m.name + (m.dosage ? " • " + m.dosage : "") },
          { icon: "document-text", title: "Clinical Notes", data: notes, route: "Notes", render: (n) => n.note_text },
          { icon: "flask", title: "Lab Results", data: labResults, route: "Labs", render: (r) => r.test_name + (!isUrl(r.result_value) && r.result_value ? ": " + r.result_value : "") },
          { icon: "warning", title: "Allergies", data: allergies, route: "Allergies", render: (a) => a.allergen },
        ].map(({ icon, title, data, route, render }) => (
          <View key={title} style={[styles.sectionCard, { backgroundColor: colors.card, borderRadius: Math.round(width * 0.04), padding: Math.round(width * 0.045), marginBottom: pad }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name={icon} size={Math.round(width * 0.046)} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: Math.round(width * 0.038) }]}>{title}</Text>
              {data.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate(route)} style={{ marginLeft: "auto" }}>
                  <Text style={[styles.viewAll, { color: colors.primary, fontSize: Math.round(width * 0.03) }]}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {data.length === 0
              ? <Text style={[styles.emptyText, { color: colors.mutedForeground, fontSize: Math.round(width * 0.033) }]}>No records</Text>
              : data.slice(0, 2).map((item, i) => (
                <View key={item.id ?? i} style={[styles.listItem, { borderBottomColor: colors.border, borderBottomWidth: i < Math.min(data.length, 2) - 1 ? 1 : 0 }]}>
                  <Text style={[styles.itemText, { color: colors.foreground, fontSize: Math.round(width * 0.035) }]}>{render(item)}</Text>
                </View>
              ))
            }
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { marginTop: 12 },
  scroll: {},
  headerCard: {
    padding: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  patientName: { fontWeight: "700" },
  patientSub: { marginTop: 2 },
  patientMeta: { marginTop: 2 },
  headerLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerLocationText: {},
  initialsCircle: { justifyContent: "center", alignItems: "center" },
  initialsText: { color: "#fff", fontWeight: "800" },
  yearBadge: { marginTop: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: "center" },
  yearBadgeText: { color: "#fff", fontWeight: "700" },
  physicalCard: { justifyContent: "space-between", padding: 20, marginHorizontal: 5, overflow: "hidden", position: "relative" },
  watermarkLogo: { position: "absolute", opacity: 0.3, tintColor: "#7FFFE1", transform: [{ rotate: "18deg" }] },
  cardTop: { flexDirection: "row", alignItems: "center" },
  cardLabel: { color: "#D7FFF5", letterSpacing: 1 },
  cardId: { fontWeight: "800", color: "#FFFFFF" },
  cardHint: { color: "#B7E5DD" },
  progressBar: { height: 6, backgroundColor: "rgba(255,255,255,0.19)", borderRadius: 10, overflow: "hidden", marginTop: 6 },
  progressFill: { height: "100%", backgroundColor: "#7FFFE1" },
  cardBtn: { backgroundColor: "#000", borderRadius: 14, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  cardBtnArrow: { fontWeight: "700" },
  cardBtnText: { fontWeight: "700" },
  statusBadge: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignSelf: "flex-start" },
  statusText: { fontWeight: "700", color: "#0B1C1A" },
  infoCard: { padding: 14, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: {},
  sectionGroupTitle: { fontWeight: "700" },
  vitalsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  vitalCard: { alignItems: "center", marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  vitalValue: { fontWeight: "700", marginTop: 6 },
  vitalLabel: { marginTop: 2 },
  sectionCard: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontWeight: "700" },
  viewAll: { fontWeight: "600" },
  listItem: { paddingVertical: 10 },
  itemText: {},
  emptyText: { fontStyle: "italic", paddingVertical: 6 },
});
