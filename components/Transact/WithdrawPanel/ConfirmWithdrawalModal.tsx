import React, { useEffect } from "react";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useContext } from "react";

import classNames from "classnames";

import { Tooltip as ReactTooltip } from "react-tooltip";

import _debounce from "lodash/debounce";
import { ThemeContext } from "../../../context/ThemeContext";
import { UserContext } from "../../../context/UserContext";
import { WalletContext } from "../../../context/WalletContext";

const types = [{ name: "Add" }, { name: "Remove" }];

const ConfirmWithdrawalModal = ({
  isManual,
  token,
  chain,
  makeWithdrawal,
}: any) => {
  const { theme } = useContext(ThemeContext);
  const { priceChange24h } = useContext(UserContext);
  const { getGasEstimate } = useContext(WalletContext);

  let [isOpen, setIsOpen] = useState(false);

  let [gasFee, setGasFee] = useState<Number | null>(null);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  useEffect(() => {
    async function calcGasFee() {
      let gasLimit = token === "ETH" ? 21000 : 75000;
      let gasFeeEth = await getGasEstimate(gasLimit);

      if (!gasFeeEth) return;

      let ethPrice = priceChange24h["ETH"]?.price;

      setGasFee(gasFeeEth * ethPrice);
    }

    // Call the async function
    calcGasFee();
  }, [chain, token]);

  let automaticTooltip =
    "This will deduct the gas fee from your balance and transfer funds directly to your address.";
  let manualTooltip =
    "This will require another call to the smart contract to withdraw the funds.";

  return (
    <div className={classNames(isManual ? "" : " w-3/4", "mx-1")}>
      <ReactTooltip id="withdrawal-tooltip" opacity={1} />
      <button
        // disabled={true}
        className={classNames(
          "w-full mx-1 py-3 mt-8 text-center rounded-lg hover:opacity-70",
          isManual ? "bg-blue" : "bg-red"
        )}
        data-tooltip-id="withdrawal-tooltip"
        data-tooltip-content={isManual ? manualTooltip : automaticTooltip}
        onClick={openModal}
      >
        <strong>{isManual ? "Manual" : "Automatic"} Withdrawal</strong>
      </button>

      {!isManual ? (
        <p className="text-right mr-5 pt-1">
          <em>Estimated Gas Cost: ~{gasFee?.toFixed(2)}$</em>
        </p>
      ) : null}

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
            className="fixed inset-0 overflow-y-auto"
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
                <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-center align-middle transition-all transform rounded-lg shadow-xl bg-border_color">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 "
                  >
                    {isManual ? "MANUAL" : "AUTOMATIC"} WITHDRAWAL<br></br>
                    {!isManual ? (
                      <em
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                        }}
                      >
                        (recommended)
                      </em>
                    ) : null}
                  </Dialog.Title>
                  {/* BUTTON */}
                  <div className="mt-6">
                    <p className="mb-5">
                      <em
                        style={{
                          color: "grey",
                          fontSize: "1rem",
                          fontWeight: "600",
                        }}
                      >
                        *Please note that withdrawals are processed at the end
                        of every batch which can take up to 3 hours
                      </em>
                    </p>

                    {isManual ? (
                      <p
                        style={{
                          fontWeight: "600",
                        }}
                      >
                        Executing a manual withdrawal means you will need to
                        call the contract to withdraw the funds. This will
                        require you to have enough gas in your wallet to pay for
                        the transaction. After the withdrawal is processed (up
                        to 3 hours), a box will appear below to claim your
                        funds.
                      </p>
                    ) : (
                      <p
                        style={{
                          fontWeight: "600",
                        }}
                      >
                        Executing an automatic withdrawal means the funds will
                        be sent to your wallet automatically. This doesen't
                        require the user to have any balance in their wallet,
                        since the gas fee will be deducted from the withdrawal
                        amount.
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className="justify-center w-full px-4 py-2.5 text-sm text-white font-medium rounded-md bg-blue hover:opacity-70"
                      onClick={async () => {
                        makeWithdrawal(isManual);
                        closeModal();
                      }}
                    >
                      Execute Withdrawal
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

export default ConfirmWithdrawalModal;
