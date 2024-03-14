import React from "react";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useContext } from "react";

import classNames from "classnames";
import { ThemeContext } from "../../../context/ThemeContext";
import { useRouter } from "next/router";

type props = {
  shouldOpen: boolean | undefined;
};

const LandingModal = ({ shouldOpen }: props) => {
  const { theme } = useContext(ThemeContext);

  let [isOpen, setIsOpen] = useState(shouldOpen ?? false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "50%",
        left: "50%",
        zIndex: 100,
      }}
    >
      <div
        className={classNames(
          "flex items-center justify-center",
          theme === "dark" && "dark"
        )}
      ></div>

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

          <div
            className="fixed inset-0 overflow-y-auto "
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
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
                    className="text-xl my-3 font-bold leading-6 text-gray-900"
                  >
                    Welcome to Invisible Exchange!
                  </Dialog.Title>
                  <Dialog.Description className="mt-4 text-lg text-gray-500">
                    Welcome to the first public testnet version of our new
                    Invisible DEX. Invisible is an app-specific ZK rollup using
                    starkware{"'"}s prover technology, designed to maintain user
                    privacy and imporve user experience. Please be aware that
                    this is a testnet version that may contain bugs or be down
                    for maintenance. If you have any questions or feedback,
                    contact us on twitter or discord. <button></button>
                  </Dialog.Description>

                  {/* BUTTON */}
                  <div className="mt-6">
                    <button
                      type="button"
                      className="justify-center w-full px-4 py-2.5 text-sm text-white font-medium  rounded-md bg-blue hover:opacity-90"
                      onClick={async () => {
                        closeModal();
                      }}
                    >
                      <h2 className="text-md font-medium"> Try it out!</h2>
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

export default LandingModal;
