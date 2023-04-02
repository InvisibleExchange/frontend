import { Listbox, Transition } from "@headlessui/react";
import React, { useEffect, useRef, useState, Fragment } from "react";
import { FaCog } from "react-icons/fa";
import { HiChevronUpDown } from "react-icons/hi2";
import { usePopper } from "react-popper";

const PositionSelector = ({
  positions,
  selectedPosition,
  onSelectPosition,
}: any) => {
  return (
    <Listbox value={selectedPosition} onChange={onSelectPosition}>
      <div className="mr-2">
        <Listbox.Button className="relative py-1 pl-3 pr-8 text-sm text-left text-white shadow-md cursor-default rounded-2xl bg-blue ">
          <span className="block truncate">
            {selectedPosition ? selectedPosition.synthetic_token : "Open new"}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <HiChevronUpDown
              className="w-4 h-4 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute w-24 py-1 overflow-auto text-base shadow-lg rounded-xl bg-fg_above_color">
            <Listbox.Option
              key={3236423}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 pl-2 pr-4 ${
                  active
                    ? "dark:bg-fg_below_color bg-border_color"
                    : "text-gray-900"
                }`
              }
              value={null}
            >
              {({ selected }) => (
                <>
                  <span
                    className={`block truncate text-sm ${
                      selected ? "font-bold" : "font-normal"
                    }`}
                  >
                    Open New
                  </span>
                </>
              )}
            </Listbox.Option>

            {/* Positions */}
            {positions
              ? positions.map((pos, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-2 pr-4 ${
                        active
                          ? "dark:bg-fg_below_color bg-border_color"
                          : "text-gray-900"
                      }`
                    }
                    value={pos}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate text-sm ${
                            selected ? "font-bold" : "font-normal"
                          }`}
                        >
                          {pos.synthetic_amount}
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))
              : null}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default PositionSelector;
