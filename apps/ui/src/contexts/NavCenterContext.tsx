'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface NavCenterContextValue {
  center: ReactNode;
  setCenter: (node: ReactNode) => void;
}

const NavCenterContext = createContext<NavCenterContextValue>({
  center: null,
  setCenter: () => {},
});

export function NavCenterProvider({ children }: { children: ReactNode }) {
  const [center, setCenter] = useState<ReactNode>(null);
  return (
    <NavCenterContext.Provider value={{ center, setCenter }}>
      {children}
    </NavCenterContext.Provider>
  );
}

export const useNavCenter = () => useContext(NavCenterContext);
