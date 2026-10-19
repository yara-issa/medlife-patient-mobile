import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePatient } from "../context/PatientContext";
import { useTheme } from "../context/ThemeContext";

export default function SplashScreen({ navigation }) {
  const { loadPatient } = usePatient();
  const { loadDarkModePreference } = useTheme();

  useEffect(() => {
    const checkSession = async () => {
      const session = await AsyncStorage.getItem("USER_SESSION");

      if (session) {
        const user = JSON.parse(session);

        await loadDarkModePreference(user.profileId);
        await loadPatient(user.profileId, user.email);

        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  logo: { width: 220, height: 160 },
});
