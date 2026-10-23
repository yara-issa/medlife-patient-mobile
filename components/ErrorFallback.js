import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { lightTheme as theme } from "../theme";

export function ErrorFallback({ error, resetError }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message ?? "An unexpected error occurred."}</Text>
      <TouchableOpacity style={styles.button} onPress={resetError} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: theme.background },
  title: { fontSize: 22, fontWeight: "700", color: theme.foreground, marginBottom: 10, textAlign: "center" },
  message: { fontSize: 14, color: theme.mutedForeground, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  button: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, backgroundColor: theme.primary },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
