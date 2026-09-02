import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export function useRefetchOnFocus(refetch: () => void) {
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
}
