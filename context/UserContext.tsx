import { createContext } from "react";

interface Props {
  children: React.ReactNode;
}

export type UserContextType = {
  username: string | null;
};

export const UserContext = createContext<UserContextType>({
  username: null,
});

// ================================================================================

function UserProvider({ children }: Props) {
  return (
    <UserContext.Provider
      value={{
        username: "hello",
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
