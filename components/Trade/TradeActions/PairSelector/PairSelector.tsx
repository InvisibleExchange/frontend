import { useState, Fragment, useContext, useEffect } from "react";
import classNames from "classnames";
import { Popover, Listbox, Transition } from "@headlessui/react";
import { FaAngleDown } from "react-icons/fa";
import { HiChevronUpDown } from "react-icons/hi2";

import MarketsList from "./MarketsList/MarketsList";

import { useDispatch, useSelector } from "react-redux";

import {
  setSelectTradeType,
  tradeTypeSelector,
} from "../../../../lib/store/features/apiSlice";
import { marketList } from "../../../../data/markets";
import { WalletContext } from "../../../../context/WalletContext";

const types = [{ name: "Perpetual" }, { name: "Spot" }];

export default function PairSelector() {
  const { selectedType, setSelectedType, selectedMarket, setSelectedMarket } =
    useContext(WalletContext);

  useEffect(() => {}, [selectedMarket, selectedType]);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const dispatch = useDispatch();

  // const selectedType = useSelector(tradeTypeSelector);

  const onSelectType = (type: any) => {
    dispatch(setSelectTradeType(type));
    setSelectedType(type.name.toLowerCase());
  };

  return (
    <Popover className="relative z-50">
      {({ open }) => (
        <>
          <div className="flex items-center justify-between w-full bg-fg_above_color">
            <Popover.Button className="flex items-center gap-1 px-4 py-3 outline-none bg-fg_above_color">
              <p className="font-semibold tracking-wider text-primary_color">
                {selectedType === "perpetual"
                  ? selectedMarket.perpetual
                  : selectedMarket.pairs}
              </p>
              <FaAngleDown
                className={classNames(
                  "w-4 h-4",
                  open && "rotate-180 transform"
                )}
              />
            </Popover.Button>
            <Listbox value={selectedType} onChange={onSelectType}>
              <div className="mr-2">
                <Listbox.Button className="relative py-1 pl-3 pr-8 text-sm text-left text-white shadow-md cursor-default rounded-2xl bg-blue ">
                  <span className="block truncate">{selectedType}</span>
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
                    {types.map((type, index) => (
                      <Listbox.Option
                        key={index}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-2 pr-4 ${
                            active
                              ? "dark:bg-fg_below_color bg-border_color"
                              : "text-gray-900"
                          }`
                        }
                        value={type}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate text-sm ${
                                selected ? "font-bold" : "font-normal"
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
          </div>
          <Transition
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute z-10 w-screen max-w-md pb-5 mt-1 transform border rounded-lg shadow-2xl left-1 border-border_color bg-bg_color">
              <MarketsList
                close={() => setIsOpen(false)}
                marketList={marketList}
                setCurrentMarket={setSelectedMarket}
                isCurrentMarket={selectedMarket}
              />
            </Popover.Panel>{" "}
          </Transition>
        </>
      )}
    </Popover>
  );
}
