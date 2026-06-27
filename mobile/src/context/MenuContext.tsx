import React, { createContext, useState, useContext } from 'react';

type MenuContextType = {
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
};

const MenuContext = createContext<MenuContextType>({
  isMenuOpen: false,
  setIsMenuOpen: () => {},
});

export const MenuProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <MenuContext.Provider value={{ isMenuOpen, setIsMenuOpen }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
