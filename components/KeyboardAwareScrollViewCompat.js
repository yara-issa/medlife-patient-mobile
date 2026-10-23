import { Platform, ScrollView } from "react-native";

export function KeyboardAwareScrollViewCompat({ children, keyboardShouldPersistTaps = "handled", ...props }) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
