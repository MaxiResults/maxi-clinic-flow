import React, { createContext, useContext, useState } from 'react';

interface UnreadContextType {
  totalUnread: number;
  setTotalUnread: React.Dispatch<React.SetStateAction<number>>;
}

const UnreadContext = createContext<UnreadContextType>({
  totalUnread: 0,
  setTotalUnread: () => {},
});

export const UnreadProvider = ({ children }: { children: React.ReactNode }) => {
  const [totalUnread, setTotalUnread] = useState(0);
  return (
    <UnreadContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => useContext(UnreadContext);