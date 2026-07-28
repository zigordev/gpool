'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Lets a route contribute chrome that AppNav renders: `subBar` (the pool's
 * header strip) and `poolActions` (buttons inside it). The old `center`
 * slot fed a topbar tab strip that no longer exists — sections are Sidebar
 * destinations now, so it was removed rather than left as a slot nothing
 * reads.
 */
interface NavCenterContextValue {
  subBar: ReactNode;
  setSubBar: (node: ReactNode) => void;
  poolActions: ReactNode;
  setPoolActions: (node: ReactNode) => void;
}

const NavCenterContext = createContext<NavCenterContextValue>({
  subBar: null,
  setSubBar: () => {},
  poolActions: null,
  setPoolActions: () => {},
});

export function NavCenterProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [subBar, setSubBar] = useState<ReactNode>(null);
  const [poolActions, setPoolActions] = useState<ReactNode>(null);
  return (
    <NavCenterContext.Provider value={{ subBar, setSubBar, poolActions, setPoolActions }}>
      {children}
    </NavCenterContext.Provider>
  );
}

export const useNavCenter = () => useContext(NavCenterContext);
