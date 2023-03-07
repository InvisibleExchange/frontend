import {
  createContext,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

import { BigNumber, ethers, utils } from "ethers";

interface Props {
  children: React.ReactNode;
}

export type UserContextType = {
  user: string | null;
  setValue: (value: string) => void;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  setValue: () => {},
});

// export type TokenBalanceType = { value: BigNumber; valueReadable: number }

export type TokenBalanceObject = Record<string, BigNumber | undefined>;
export type TokenAllowanceObject = Record<string, BigNumber | undefined>;

function UserProvider({ children }: Props) {
  const [username, setUsername] = useState<string | null>(null);

  // Reconnect if previously connected
  useEffect(() => {}, []);

  const setValue = async (label?: string) => {
    console.log(label);
    console.log("start setValue");
  };

  return (
    <UserContext.Provider
      value={{
        user: username,
        setValue: setValue,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
