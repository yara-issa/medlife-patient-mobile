import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { usePatient } from "../context/PatientContext";
import { useTheme } from "../context/ThemeContext";
import { sendOTP, generateOTP } from "../services/emailjs";

export default function VerificationScreen({ navigation, route }) {
  const { email, code, profileId } = route.params;
  const { loadPatient } = usePatient();
  const { loadDarkModePreference } = useTheme();

  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const [currentCode, setCurrentCode] = useState(code);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const refs = useRef([]);

  useFocusEffect(
    useCallback(() => {
      const checkSession = async () => {
        const session = await AsyncStorage.getItem("USER_SESSION");

        if (session) {
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        }
      };

      checkSession();
    }, [])
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const fmt = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);

    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);

    if (digit && index < 4) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKey = (key, index) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const entered = digits.join("");

    if (entered.length < 5) {
      Alert.alert("Error", "Enter full 5-digit code");
      return;
    }

    if (entered !== currentCode) {
      Alert.alert("Error", "Invalid verification code");
      setDigits(["", "", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }

    setLoading(true);

    try {
      await loadDarkModePreference(profileId);
      await loadPatient(profileId, email);

      await AsyncStorage.setItem(
        "USER_SESSION",
        JSON.stringify({ profileId, email })
      );

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (e) {
      Alert.alert("Error", "Login failed");
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;

    const newCode = generateOTP();

    setCurrentCode(newCode);
    setDigits(["", "", "", "", ""]);
    setTimeLeft(120);
    setCanResend(false);

    refs.current[0]?.focus();

    try {
      await sendOTP(email, newCode);
    } catch {
      Alert.alert("Error", "Failed to resend code");
    }
  };

  const masked = email.replace(
    /^(.{2}).*(@.*)$/,
    (_, a, b) => a + "***" + b
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>✓</Text>
          </View>

          <Text style={styles.title}>Verification Code</Text>

          <Text style={styles.subtitle}>
            Sent to <Text style={styles.email}>{masked}</Text>
          </Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => (refs.current[i] = r)}
                style={[styles.otpBox, d && styles.otpFilled]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKey(e.nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                autoFocus={i === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>VERIFY</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottom}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resend}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timer}>
                Resend in <Text style={styles.bold}>{fmt(timeLeft)}</Text>
              </Text>
            )}
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F8",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    alignItems: "center",
  },
  iconCircle: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: "#E6F7F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    fontSize: 36,
    color: "#128C7E",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 25,
    textAlign: "center",
  },
  email: {
    color: "#128C7E",
    fontWeight: "600",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: 25,
  },
  otpBox: {
    width: 50,
    height: 55,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#F0F3F4",
    fontSize: 22,
    fontWeight: "bold",
  },
  otpFilled: {
    borderColor: "#128C7E",
    backgroundColor: "#E6F7F4",
  },
  button: {
    width: "100%",
    backgroundColor: "#128C7E",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  bottom: {
    marginTop: 15,
    alignItems: "center",
  },
  timer: {
    color: "#888",
    fontSize: 13,
  },
  bold: {
    color: "#128C7E",
    fontWeight: "700",
  },
  resend: {
    color: "#128C7E",
    fontWeight: "700",
    fontSize: 14,
  },
});
