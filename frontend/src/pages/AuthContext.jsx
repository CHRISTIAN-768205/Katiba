// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import * as client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!client.getToken()) return setLoading(false);
      try {
        setUser(await client.getMe());
      } catch {
        client.setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /**
   * Register a new account.
   * @param {{
   *   name: string,
   *   email: string,
   *   password: string,
   *   role?: "citizen" | "advocate" | "mediator",
   *   phone?: string,
   *   bio?: string,
   *   barNumber?: string,
   *   lawFirm?: string,
   *   yearsOfExperience?: number,
   *   practiceAreas?: string[],
   *   mediationNumber?: string,
   *   mediatorProfession?: string,
   *   mediationSpecialties?: string[],
   *   mediationStyle?: string,
   *   mediationFeeRange?: { min: number, max: number, currency: string },
   * }} payload
   */
  async function register(payload) {
    // Guard: catch accidental positional calls during development.
    if (typeof payload !== "object" || payload === null) {
      throw new Error(
        "register() must be called with a single payload object, e.g. register({ name, email, password, role })"
      );
    }

    console.log("📤 register payload:", payload);

    const { token, user } = await client.register(payload);
    client.setToken(token);
    setUser(user);
    return user;
  }

  async function login(credentials) {
    const { token, user } = await client.login(credentials);
    client.setToken(token);
    setUser(user);
    return user;
  }

  function logout() {
    client.setToken(null);
    setUser(null);
  }

  function updateUser(updated) {
    setUser(updated);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);