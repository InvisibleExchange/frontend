import React from "react";

import {
  Dialog,
  Transition,
  Listbox,
  RadioGroup,
  Tab,
} from "@headlessui/react";
import { Fragment, useState, useContext } from "react";

import { FaEdit } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { ThemeContext } from "../../../../../context/ThemeContext";
import classNames from "classnames";
import TooltipCloseSlider from "./ClosePositionSlider";
import { UserContext } from "../../../../../context/UserContext";

import _debounce from "lodash/debounce";

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
} = require("../../../../../app_logic/helpers/utils");

const {
  sendPerpOrder,
} = require("../../../../../app_logic/transactions/constructOrders");

const types = [{ name: "Add" }, { name: "Remove" }];

const CloseModal = ({ position, setToastMessage }: any) => {
  const { theme } = useContext(ThemeContext);
  const { user, getMarkPrice } = useContext(UserContext);

  let [categories] = useState(["Limit", "Market"]);

  let [isMarket, setIsMarket] = useState(false);

  let [isOpen, setIsOpen] = useState(false);

  let [price, setPrice] = useState<number | null>(null);
  let [amount, setAmount] = useState(0);

  let [percent, setPercent] = useState(0);

  let positionSize =
    position.position_size /
    10 ** DECIMALS_PER_ASSET[position.position_header.synthetic_token];

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  function _handleSliderChange(val: any) {
    let closeAmount = positionSize * (val / 100);

    setAmount(closeAmount);
    setPercent(Number(val));
  }
  const handleSliderChange = _debounce(_handleSliderChange, 100);

  function handleAmountChange(amount: number) {
    setAmount(amount);

    let closePercent = (amount / positionSize) * 100;

    setPercent(closePercent);
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
          // disabled={!orders || orders.length == 0}
          style={{
            fontWeight: 900,
            borderRadius: 15,
            backgroundColor: "rgba(0,0,0, 0.3)",
            zIndex: 0,
          }}
          className="mr-20 px-5 rounded border border-red p-2 hover:opacity-70 text-red"
          onClick={openModal}
        >
          Close
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
                    Close Position
                  </Dialog.Title>
                  <div className="mt-5">
                    <div className="flex items-center mt-2">
                      <div className="relative w-full">
                        {/* LIMIT/MARKET SELECTOR */}

                        <Tab.Group
                          onChange={(e) => {
                            setIsMarket(!!e);
                          }}
                        >
                          <Tab.List className="flex space-x-5 rounded-xl bg-blue-900/20">
                            {categories.map((category) => (
                              <Tab
                                key={category}
                                className={({ selected }) =>
                                  classNames(
                                    "rounded-lg text-sm py-2 font-lg leading-5 tracking-wider outline-none",
                                    selected
                                      ? "text-white hover:outline-none "
                                      : "opacity-50"
                                  )
                                }
                                style={{
                                  fontWeight: 900,
                                }}
                              >
                                {category}
                              </Tab>
                            ))}
                          </Tab.List>

                          <Tab.Panels className="mt-2">
                            <Tab.Panel className={classNames("rounded-xl")}>
                              {/* PRICE =================================== */}
                              <div className="flex justify-between text-sm dark:text-gray_lighter ">
                                <p>Price(USD)</p>
                              </div>
                              <div className="relative">
                                <input
                                  className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-fg_below_color ring-border_color  no-arrows"
                                  value={price?.toString()}
                                  onChange={(e) =>
                                    setPrice(Number(e.target.value))
                                  }
                                />
                              </div>
                            </Tab.Panel>

                            <Tab.Panel className={classNames("rounded-xl")}>
                              {/* PRICE =================================== */}
                              {/* <div className="flex justify-between text-sm dark:text-gray_lighter ">
                                <p>Price(USD)</p>
                              </div>
                              <div className="relative">
                                <input
                                  disabled={true}
                                  className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-fg_below_color ring-border_color disabled:opacity-75  no-arrows"
                                  value={
                                    price
                                      ? price.toFixed(2)
                                      : getMarkPrice(
                                          position.position_header.synthetic_token,
                                          true
                                        ).toFixed(2)
                                  }
                                />
                              </div> */}
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>

                        {/* AMOUNT =================================== */}
                        <div className="flex justify-between text-sm dark:text-gray_lighter  mt-6">
                          <p>
                            Amount(
                            {
                              IDS_TO_SYMBOLS[
                                position.position_header.synthetic_token
                              ]
                            }
                            )
                          </p>
                          <p>
                            Max:{" "}
                            <span
                              className="dark:text-white cursor-pointer"
                              onClick={() =>
                                handleAmountChange(Number(positionSize))
                              }
                            >
                              {positionSize}{" "}
                              {
                                IDS_TO_SYMBOLS[
                                  position.position_header.synthetic_token
                                ]
                              }
                            </span>
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            disabled={true}
                            style={{
                              color: "white",
                            }}
                            className="w-full py-1.5 pl-4 font-light tracking-wider  rounded-md outline-none ring-1 dark:bg-fg_below_color ring-border_color disabled:opacity-75 no-arrows"
                            value={amount.toFixed(3)}
                            onChange={(e) =>
                              handleAmountChange(Number(e.target.value))
                            }
                          />
                        </div>

                        <div className="py-10 mx-5">
                          <TooltipCloseSlider
                            tipFormatter={(v: any) => {
                              return `${v}`;
                            }}
                            tipProps={{ overlayClassName: "foo" }}
                            onChange={handleSliderChange}
                            value={percent}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <div className="mt-6">
                    <button
                      type="button"
                      className="justify-center w-full px-4 py-2.5 text-sm text-white font-medium  rounded-md bg-blue hover:opacity-90"
                      onClick={async () => {
                        if (!amount) {
                          setToastMessage({
                            type: "error",
                            message: "Please enter a valid amount",
                          });

                          return;
                        }

                        if (!price) {
                          price = getMarkPrice(
                            position.position_header.synthetic_token,
                            true
                          );
                        }

                        await onSumbitCloseOrder(
                          user,
                          position,
                          isMarket,
                          amount,
                          price,
                          setToastMessage
                        );
                        closeModal();
                      }}
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

export default CloseModal;

const onSumbitCloseOrder = async (
  user: any,
  position: any,
  isMarket: boolean,
  closeAmount: number,
  price: number | null,
  setToastMessage: any
) => {
  try {
    await sendPerpOrder(
      user,
      position.order_side == "Long" ? "Short" : "Long",
      600_000, // ~1 weeks
      "Close",
      position.position_header.position_address, // position address
      position.position_header.synthetic_token, //token
      closeAmount, //amount
      price,
      null, // initial margin
      0.07, // fee_limit %
      3, // slippage %
      isMarket
    );
  } catch (error: any) {
    setToastMessage({
      type: "error",
      message: error.toString(),
    });
  }
};
