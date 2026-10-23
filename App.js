import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "./context/ThemeContext";
import { PatientProvider } from "./context/PatientContext";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  return (
    <ThemeProvider>
      <PatientProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PatientProvider>
    </ThemeProvider>
  );
}
