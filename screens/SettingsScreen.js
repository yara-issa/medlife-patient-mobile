import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Switch, Alert, Platform,
  ScrollView, Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { usePatient } from "../context/PatientContext";

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleDarkMode, resetDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { patient, profileImage, updateProfileImage, logout } = usePatient();
  const profileId = patient?.id ?? "";

  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const initials = getInitials(patient?.full_name);
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingSource, setPendingSource] = useState("camera");
  const [saving, setSaving] = useState(false);

  const pickFromGallery = async () => {
    if (Platform.OS === "web") {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1 });
      if (!result.canceled) await updateProfileImage(result.assets[0].uri, profileId);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) Alert.alert("Photo Library Blocked", "Go to your device Settings and enable Photo Library for MedLife.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled) { setPendingSource("gallery"); setPendingPhoto(result.assets[0].uri); }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") { Alert.alert("Not Available", "Camera is not available in the browser version."); return; }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) Alert.alert("Camera Blocked", "Go to your device Settings and enable Camera for MedLife.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!result.canceled) { setPendingSource("camera"); setPendingPhoto(result.assets[0].uri); }
  };

  const confirmPhoto = async () => {
    if (!pendingPhoto) return;
    setSaving(true);
    await updateProfileImage(pendingPhoto, profileId);
    setSaving(false);
    setPendingPhoto(null);
  };

  const discardPhoto = () => {
    setPendingPhoto(null);
    if (pendingSource === "camera") takePhoto();
    else pickFromGallery();
  };

  const removePhoto = () => {
    Alert.alert("Remove Profile Photo", "Are you sure you want to remove your profile picture?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await updateProfileImage(null, profileId); } },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive", onPress: async () => {
          resetDarkMode();
          await logout();
          navigation.replace("Login");
        }
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.pageHeader, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.backIcon, { backgroundColor: colors.secondary }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.primary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Profile Picture</Text>
          <View style={styles.avatarRow}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.placeholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.placeholderInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.photoButtons}>
              <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.secondary }]} onPress={pickFromGallery} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.primary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.secondary }]} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.primary }]}>Camera</Text>
              </TouchableOpacity>
              {profileImage ? (
                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: isDark ? "#2D1515" : "#FFF0F0" }]} onPress={removePhoto} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={[styles.permNote, { backgroundColor: colors.muted }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={[styles.permNoteText, { color: colors.mutedForeground }]}>Your device will ask: Allow, Allow Once, or Deny</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name={isDark ? "moon" : "sunny-outline"} size={20} color={colors.primary} />
              <Text style={[styles.cardText, { color: colors.foreground }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => toggleDarkMode(profileId)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {patient ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Signed In As</Text>
            <Text style={[styles.accountName, { color: colors.foreground }]}>{patient.full_name}</Text>
            <Text style={[styles.accountId, { color: colors.mutedForeground }]}>ID #{patient.medlife_id}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDark ? "#2D1515" : "#FFF5F5", borderColor: "#e74c3c" }]} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!pendingPhoto} animationType="fade" statusBarTranslucent onRequestClose={() => setPendingPhoto(null)}>
        <View style={styles.confirmOverlay}>
          {pendingPhoto ? <Image source={{ uri: pendingPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
          <View style={styles.confirmDim} />
          <View style={[styles.confirmTop, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.confirmTitle}>Use this photo?</Text>
            <Text style={styles.confirmSub}>{pendingSource === "gallery" ? "Selected from gallery" : "Taken with camera"}</Text>
          </View>
          <View style={[styles.confirmActions, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={discardPhoto} activeOpacity={0.85}>
              <Ionicons name={pendingSource === "gallery" ? "images-outline" : "camera-reverse-outline"} size={20} color="#fff" />
              <Text style={styles.cancelBtnText}>{pendingSource === "gallery" ? "Choose Again" : "Retake"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.useBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]} onPress={confirmPhoto} disabled={saving} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.useBtnText}>{saving ? "Saving…" : "Use Photo"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  backIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  pageTitle: { fontSize: 18, fontWeight: "700" },
  content: { padding: 15, gap: 12 },
  card: { padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardLabel: { fontSize: 11, marginBottom: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  placeholder: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  placeholderInitials: { color: "#fff", fontWeight: "800", fontSize: 28 },
  photoButtons: { flex: 1, gap: 8 },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },
  photoBtnText: { fontSize: 13, fontWeight: "600" },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#FFF0F0" },
  removeBtnText: { fontSize: 13, fontWeight: "600", color: "#e74c3c" },
  permNote: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8 },
  permNoteText: { fontSize: 11, flex: 1, lineHeight: 16 },
  cardText: { fontSize: 15 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  accountName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  accountId: { fontSize: 13 },
  logoutBtn: { borderWidth: 1.5, borderColor: "#e74c3c", padding: 14, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: "#FFF5F5" },
  logoutText: { color: "#e74c3c", fontWeight: "700", fontSize: 15 },
  confirmOverlay: { flex: 1, backgroundColor: "#000" },
  confirmDim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  confirmTop: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", paddingHorizontal: 24 },
  confirmTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.7)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  confirmSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  confirmActions: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 24, paddingTop: 24, backgroundColor: "rgba(0,0,0,0.55)", gap: 14 },
  cancelBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "rgba(255,255,255,0.12)" },
  cancelBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  useBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  useBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
