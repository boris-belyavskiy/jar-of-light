"use client";

import { createContext, useContext } from "react";

/**
 * How many rows still have readable text and no ciphertext (Horizon 1 step 3).
 * Provided by the encryption gate; read by Settings to say where the move stands.
 */
export const UnmovedContext = createContext(0);
export const useUnmoved = () => useContext(UnmovedContext);
