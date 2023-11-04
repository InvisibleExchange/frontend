import React from "react";

import { Fragment, useState } from "react";
import { Combobox, Listbox, Transition } from "@headlessui/react";
import { HiChevronUpDown, HiCheck } from "react-icons/hi2";

type props = {
  options: any;
  selected: any;
  onSelect: any;
  label: string;
  isWalletConnected?: boolean;
};

const TokenSelector = ({
  selected,
  onSelect,
  options,
  label,
  isWalletConnected,
}: props) => {
  return (
    <div className=" mt-5">
      <p className="text-sm ml-3">{label}</p>
      <Listbox value={selected} onChange={onSelect}>
        <div className="mr-2">
          {/* // * ------------------------------------------------------------- */}
          <div className="relative w-full overflow-hidden text-left rounded-lg dark:shadow-md cursor-defaul hover:ring-1 hover:dark:ring-fg_below_color">
            <Listbox.Button className="w-full py-4 pl-4 pr-10 text-base leading-5 border-none rounded-lg outline-none  bg-border_color ">
              <div className="flex">
                {selected ? (
                  <img
                    src={selected.icon.src}
                    alt="Currency Logo"
                    className="logo_icon"
                  />
                ) : null}

                <p className={`pt-1 ${selected ? "" : "opacity-50"}`}>
                  {selected ? selected.name : "Select network"}
                </p>
              </div>

              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <HiChevronUpDown
                  className="w-10 h-7 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
          </div>

          {/* // * ------------------------------------------------------------- */}
          <div className="relative w-full">
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              // afterLeave={() => setQuery("")}
            >
              <Listbox.Options className="absolute z-20 w-full py-1 mt-1 overflow-auto text-base rounded-md shadow-lg bg-border_color max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option: any) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative  cursor-default select-none py-2 pl-16 pr-4 ${
                        active ? "bg-blue bg-opacity-30 " : ""
                      }`
                    }
                    value={option}
                    disabled={!isWalletConnected}
                  >
                    <>
                      <span
                        className={`block truncate ${
                          option.id == selected?.id
                            ? "font-medium"
                            : "font-normal"
                        }`}
                      >
                        <div className="flex">
                          <button className="text-sm pr-2 ">
                            <img
                              src={option.icon.src}
                              alt="Currency Logo"
                              className="logo_icon"
                            />
                          </button>
                          <p className="pt-1">{option.name}</p>
                        </div>
                      </span>
                      {option.id == selected?.id ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center ml-5 pl-3 font-bold`}
                        >
                          <HiCheck className="w-5 h-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </div>
      </Listbox>
    </div>
  );
};

export default TokenSelector;
