import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { lightTheme } from "../theme";
import { supabase } from "../services/supabase";
import { sendOTP, generateOTP } from "../services/emailjs";

export default function LoginScreen({ navigation }) {
  const colors = lightTheme;
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanId = id.trim().replace(/^#/, "");
    if (!cleanId) { Alert.alert("Error", "Please enter your MedLife ID"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, medlife_id, role, full_name, email")
        .eq("medlife_id", cleanId)
        .eq("role", "patient")
        .single();

      if (error || !data) {
        Alert.alert("Not Found", "No patient found with that MedLife ID.");
        setLoading(false);
        return;
      }
      const email = data.email || "";
      if (!email) {
        Alert.alert("No Email", "No email on file for this account. Contact your clinic.");
        setLoading(false);
        return;
      }
      const otp = generateOTP();
      try {
        await sendOTP(email, otp);
      } catch (emailErr) {
        Alert.alert(
          "Email Error",
          "Could not send verification code: " + (emailErr.message || "Unknown error"),
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }
      navigation.navigate("Verification", {
        email,
        code: otp,
        medlifeId: data.medlife_id,
        name: data.full_name,
        role: data.role,
        profileId: data.id,
      });
    } catch (err) {
      Alert.alert("Error", err?.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your MedLife ID to receive a verification code
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.input, color: colors.foreground }]}
          value={id}
          onChangeText={setId}
          placeholder="xxx xxx xxx"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>SEND VERIFICATION CODE</Text>
          }
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          A 5-digit code will be sent to your registered email
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  logoImage: { width: 280, height: 168, marginBottom: 24 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 32, lineHeight: 22, paddingHorizontal: 8 },
  input: {
    width: "100%", padding: 18, borderRadius: 12, fontSize: 20,
    textAlign: "center", letterSpacing: 2, marginBottom: 16, fontWeight: "600",
  },
  button: { width: "100%", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
  hint: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
