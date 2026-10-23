import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import DashboardScreen from "../screens/DashboardScreen";
import MedicationsScreen from "../screens/MedicationsScreen";
import LabResultsScreen from "../screens/LabResultsScreen";
import ClinicalNotesScreen from "../screens/ClinicalNotesScreen";
import AllergiesScreen from "../screens/AllergiesScreen";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Home",        icon: "home-outline",         iconFilled: "home" },
  { name: "Medications", icon: "medkit-outline",        iconFilled: "medkit" },
  { name: "Labs",        icon: "flask-outline",         iconFilled: "flask" },
  { name: "Notes",       icon: "document-text-outline", iconFilled: "document-text" },
  { name: "Allergies",   icon: "warning-outline",       iconFilled: "warning" },
];

export default function BottomTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const botPad = Platform.OS === "web" ? 0 : insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + botPad,
          paddingBottom: botPad + 6,
          paddingTop: 6,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: -2 },
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          return (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? tab.iconFilled : tab.icon} size={22} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home"        component={DashboardScreen}    options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Medications" component={MedicationsScreen}  options={{ tabBarLabel: "Meds" }} />
      <Tab.Screen name="Labs"        component={LabResultsScreen}   options={{ tabBarLabel: "Labs" }} />
      <Tab.Screen name="Notes"       component={ClinicalNotesScreen} options={{ tabBarLabel: "Notes" }} />
      <Tab.Screen name="Allergies"   component={AllergiesScreen}    options={{ tabBarLabel: "Allergy" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  dot: { width: 4, height: 4, borderRadius: 2, position: "absolute", bottom: -7 },
});
