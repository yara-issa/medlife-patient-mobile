import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function TopBar() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={[styles.bar, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate("Reminder")}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate("Settings")}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  logo: { width: 90, height: 36 },
  actions: { flexDirection: "row", gap: 10 },
  btn: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
});
