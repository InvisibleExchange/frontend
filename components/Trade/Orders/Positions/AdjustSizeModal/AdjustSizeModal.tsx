import React from "react";

import { Dialog, Transition, Listbox } from "@headlessui/react";
import { Fragment, useState, useContext } from "react";

import { FaEdit } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { ThemeContext } from "../../../../../context/ThemeContext";
import classNames from "classnames";

const types = [{ name: "Add" }, { name: "Remove" }];

const AdjustSizeModal = () => {
  const { theme } = useContext(ThemeContext);

  let [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(types[0]);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <div>
      <div
        className={classNames(
          "flex items-center justify-center ",
          theme === "dark" && "dark"
        )}
      >
        <button
          type="button"
          onClick={openModal}
          className="rounded-m hover:opacity-75"
        >
          <FaEdit className="w-4 h-4" />
        </button>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className={classNames("relative z-10 ", theme === "dark" && "dark")}
          onClose={closeModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform rounded-lg shadow-xl bg-border_color">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900"
                  >
                    Adjust Size
                  </Dialog.Title>
                  <div className="mt-5">
                    <div className="flex justify-between text-sm dark:text-gray_lighter">
                      <p>Amount(USDT)</p>
                      <p>
                        Max addable{" "}
                        <span className="dark:text-white">7,717.52 USDT</span>
                      </p>
                    </div>
                    <div className="flex items-center mt-2">
                      <Listbox value={selected} onChange={setSelected}>
                        <div className="relative">
                          <Listbox.Button className="relative py-2.5 pl-3 text-left cursor-default w-28 rounded-l-sm dark:bg-fg_below_color bg-white">
                            <span className="text-sm">{selected.name}</span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <IoIosArrowDown
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
                            <Listbox.Options className="absolute py-1 overflow-auto text-sm rounded-sm shadow-2xl bg-fg_above_color max-h-60">
                              {types.map((type, index) => (
                                <Listbox.Option
                                  key={index}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-4 w-28 ${
                                      active
                                        ? "bg-amber-100 text-amber-900 dark:bg-fg_below_color bg-border_color"
                                        : "text-gray-900"
                                    }`
                                  }
                                  value={type}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected
                                            ? "font-medium text-yellow"
                                            : "font-normal"
                                        }`}
                                      >
                                        {type.name}
                                      </span>
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                      <div className="relative w-full">
                        <input className="w-full py-3 pl-3 font-mono text-sm rounded-r-sm dark:bg-fg_below_color focus:outline-none" />
                        <button className="absolute text-sm cursor-pointer right-4 top-3 text-yellow active:opacity-60">
                          Max
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between mt-6 text-sm dakr:text-gray_lighter">
                      <p>
                        Currently Margin for BTCUSDT <br />
                        Perpetual
                      </p>
                      <p className="font-bold dark:text-white">7,356.72 USDT</p>
                    </div>
                    <div className="flex justify-between mt-3 text-sm dark:text-gray_lighter">
                      <p>Max addable</p>
                      <p className="font-bold dark:text-white">7,717.52 USDT</p>
                    </div>
                    <div className="flex justify-between mt-3 text-sm dark:text-gray_lighter">
                      <p>Est.Liq.Price after increase</p>
                      <p className="font-bold dark:text-white">
                        14,417.19 USDT
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className="justify-center w-full px-4 py-2.5 text-sm text-white font-medium  rounded-md bg-blue hover:opacity-90"
                      onClick={closeModal}
                    >
                      Confirm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdjustSizeModal;