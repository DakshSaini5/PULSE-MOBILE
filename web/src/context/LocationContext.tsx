import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
  location: { lat: number; lng: number } | null;
  error: string | null;
  fetchLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );
  };

  useEffect(() => {
    // Optionally fetch on mount, or wait for user interaction
    fetchLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, error, fetchLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
