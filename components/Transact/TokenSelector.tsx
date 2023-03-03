import React from "react";

import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { HiChevronUpDown, HiCheck } from "react-icons/hi2";

type props = {
  tokens: any;
  selected: any;
  onSelect: any;
};

const DepositPanel = ({ selected, onSelect, tokens }: props) => {
  const [query, setQuery] = useState("");

  const filteredToken =
    query === ""
      ? tokens
      : tokens.filter((token: any) =>
          token.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );
  return (
    <div className="mt-5">
      <p className="text-sm">Select an Asset</p>
      <Combobox value={selected} onChange={onSelect}>
        <div className="relative mt-1">
          <div className="relative w-full overflow-hidden text-left rounded-lg dark:shadow-md cursor-defaul hover:ring-1 hover:dark:ring-fg_below_color">
            <Combobox.Input
              className="w-full py-4 pl-4 pr-10 text-base leading-5 border-none rounded-lg outline-none bg-border_color"
              displayValue={(person: any) => person?.name}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <HiChevronUpDown
                className="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute z-20 w-full py-1 mt-1 overflow-auto text-base rounded-md shadow-lg bg-border_color max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredToken.length === 0 && query !== "" ? (
                <div className="relative px-4 py-2 text-gray-700 cursor-default select-none">
                  Nothing found.
                </div>
              ) : (
                filteredToken.map((token: any) => (
                  <Combobox.Option
                    key={token.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-blue bg-opacity-30 " : ""
                      }`
                    }
                    value={token}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {token.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 font-bold ${
                              active ? "" : ""
                            }`}
                          >
                            <HiCheck className="w-5 h-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};

export default DepositPanel;
