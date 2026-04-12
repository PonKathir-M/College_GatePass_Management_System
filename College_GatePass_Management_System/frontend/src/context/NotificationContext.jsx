import { createContext, useState } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState("");

  return (
    <NotificationContext.Provider value={{ message, setMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};
