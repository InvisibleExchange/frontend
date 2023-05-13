import React, { useEffect, useRef, useState } from "react";
import { FaCog } from "react-icons/fa";
import { usePopper } from "react-popper";

const SettingsPopover = ({
  maxSlippage,
  setMaxSlippage,
  expirationTime,
  setExpirationTime,
  isMarket,
}: any) => {
  const [showPopover, setShowPopover] = useState(false);
  const [referenceElement, setReferenceElement] = useState<any>(null);
  const [popperElement, setPopperElement] = useState<any>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "left",
  });

  useEffect(() => {
    function handleClickOutside(e: any) {
      if (popperElement && !popperElement.contains(e.target)) {
        setShowPopover(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popperElement]);

  const handleExpTimeChange = (e: any) => {
    setExpirationTime(formatInputNum(e.target.value, 0));
  };
  const handleMaxSlipChange = (e: any) => {
    setMaxSlippage(formatInputNum(e.target.value, 1));
  };

  return (
    <div className="flex items-end justify-between w-full">
      <div></div>
      <div className="popover-button mx-5">
        <button
          ref={setReferenceElement}
          onClick={() => setShowPopover(!showPopover)}
        >
          <FaCog className="w-6 h-6 text-gray-400" aria-hidden="true" />
        </button>
        {showPopover && (
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="popover w-60 mt-10 mr-2 overflow-auto text-base shadow-lg rounded-xl bg-fg_above_color"
          >
            <div className="px-4 py-2">
              <div className="relative mt-1 ">
                <input
                  className="w-full pl-2 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
                  type="number"
                  step={1}
                  value={expirationTime}
                  onChange={handleExpTimeChange}
                  placeholder="Expiration time"
                />
                <p style={{ fontSize: "12px" }} className="pl-2">
                  Default: 4 weeks ~ 100hours
                </p>
                <div className="absolute top-0 right-0 w-16 px-3 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
                  Hours
                </div>
              </div>
            </div>

            {/* =================== */}

            <div className="px-4 py-2">
              <div className="relative mt-1">
                <input
                  className="w-full  pl-2 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
                  type="number"
                  step={0.1}
                  value={maxSlippage}
                  onChange={handleMaxSlipChange}
                  placeholder="Max Slippage"
                  disabled={!isMarket}
                />
                <p style={{ fontSize: "12px" }} className="pl-2">
                  Default: 5% (*market orders only)
                </p>
                <div className="absolute top-0 right-0 w-16 px-3 text-base  font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
                  %
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPopover;

function formatInputNum(val: any, decimals: number) {
  if (!val) {
    return null;
  }

  let decimalPointIndex = val.indexOf(".");
  if (decimalPointIndex == 0) {
    return "0" + val;
  }

  if (decimalPointIndex > -1) {
    let numDigitsAfterDecimalPoint = val.length - decimalPointIndex - 1;
    if (numDigitsAfterDecimalPoint > decimals) {
      return Number(val).toFixed(decimals);
    } else {
      return val;
    }
  } else {
    return val;
  }
}

//

//

//

//

// const wrapperRef = useRef(null);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
//         setShowPopover(false);
//       }
//     }

//     document.addEventListener('click', handleClickOutside);
//     return () => {
//       document.removeEventListener('click', handleClickOutside);
//     };
//   }, []);

//   return (
//     <div className="popover-button">
//       <button
//         ref={setReferenceElement}
//         onClick={() => setShowPopover(!showPopover)}
//       >
//         <FaCog />
//       </button>
//       {showPopover && (
//         <div
//           ref={setPopperElement}
//           style={styles.popper}
//           {...attributes.popper}
//           className="popover"
//           ref={wrapperRef}
//         >
//           <button onClick={() => setToggle1(!toggle1)}>
//             Toggle 1: {toggle1 ? 'On' : 'Off'}
//           </button>
//           <button onClick={() => setToggle2(!toggle2)}>
//             Toggle 2: {toggle2 ? 'On' : 'Off'}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };
