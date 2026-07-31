import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.types";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}