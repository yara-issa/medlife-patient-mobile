import React, { createContext, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "../theme";

const ThemeContext = createContext({
  colors: lightTheme,
  isDark: false,
  toggleDarkMode: async () => {},
  loadDarkModePreference: async () => {},
  resetDarkMode: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const loadDarkModePreference = async (patientId) => {
    if (!patientId) {
      setIsDark(false);
      return;
    }
    try {
      const val = await AsyncStorage.getItem("DARK_MODE_" + patientId);
      setIsDark(val === "true");
    } catch (_) {
      setIsDark(false);
    }
  };

  const toggleDarkMode = async (patientId) => {
    const newVal = !isDark;
    setIsDark(newVal);
    if (patientId) {
      try {
        await AsyncStorage.setItem("DARK_MODE_" + patientId, String(newVal));
      } catch (_) {}
    }
  };

  const resetDarkMode = () => {
    setIsDark(false);
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleDarkMode, loadDarkModePreference, resetDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
