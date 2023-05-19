import * as React from "react";
import "rc-tooltip/assets/bootstrap.css";
import "rc-slider/assets/index.css";
import Slider from "rc-slider";
import type { SliderProps } from "rc-slider";
import raf from "rc-util/lib/raf";
import Tooltip from "rc-tooltip";

import { ThemeContext } from "../../../../context/ThemeContext";

const HandleTooltip = (props: {
  value: number;
  children: React.ReactElement;
  visible: boolean;
  colorPair: any;
  tipFormatter?: (value: number) => React.ReactNode;
}) => {
  const {
    value,
    children,
    visible,
    tipFormatter = (val) => `${val}`,
    colorPair,
    ...restProps
  } = props;

  const tooltipRef = React.useRef<any>();
  const rafRef = React.useRef<number | null>(null);

  function cancelKeepAlign() {
    raf.cancel(rafRef.current!);
  }

  function keepAlign() {
    rafRef.current = raf(() => {
      tooltipRef.current?.forceAlign();
    });
  }

  React.useEffect(() => {
    if (visible) {
      keepAlign();
    } else {
      cancelKeepAlign();
    }

    return cancelKeepAlign;
  }, [value, visible]);

  return (
    <Tooltip
      placement="top"
      overlay={tipFormatter(Math.abs(value))}
      overlayInnerStyle={{
        minHeight: "auto",
        color: value >= 0 ? colorPair.positiveColor : colorPair.negativeColor,
        fontWeight: "bolder",
        fontSize: "small",
        fontFamily: "sans-serif",
        textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)",
      }}
      ref={tooltipRef}
      visible={visible}
      {...restProps}
    >
      {children}
    </Tooltip>
  );
};

// export const handleRender: SliderProps["handleRender"] = (node, props) => {
//   return (
//     <HandleTooltip value={props.value} visible={props.dragging}>
//       {node}
//     </HandleTooltip>
//   );
// };

const TooltipPerpetualSlider = ({
  tipFormatter,
  tipProps,
  minLeverage,
  maxLeverage,
  defaultValue,
  orderSide,
  ...props
}: SliderProps & {
  tipFormatter?: (value: number) => React.ReactNode;
  tipProps: any;
  maxLeverage: number;
  minLeverage: number;
  orderSide: "Long" | "Short" | "none";
}) => {
  const { theme } = React.useContext(ThemeContext);

  const tipHandleRender: SliderProps["handleRender"] = (node, handleProps) => {
    return (
      <HandleTooltip
        value={handleProps.value}
        visible={handleProps.dragging}
        tipFormatter={tipFormatter}
        colorPair={{ positiveColor, negativeColor }}
        {...tipProps}
      >
        {node}
      </HandleTooltip>
    );
  };

  let positiveColor;
  let negativeColor;
  if (!orderSide || orderSide === "none") {
    positiveColor = "rgb(183, 189, 198)";
    negativeColor = "rgb(183, 189, 198)";
  } else {
    if (orderSide === "Long") {
      positiveColor = "green";
      negativeColor = "#9A2018";
    } else {
      positiveColor = "#9A2018";
      negativeColor = "green";
    }
  }

  let marks = {};
  marks[minLeverage] = (
    <div
      style={{
        color: minLeverage >= 0 ? positiveColor : negativeColor,
        fontWeight: 900,
      }}
    >
      {Math.abs(minLeverage).toString() + "x"}{" "}
    </div>
  );
  marks[maxLeverage] = (
    <div
      style={{
        color: maxLeverage >= 0 ? positiveColor : negativeColor,
        fontWeight: 900,
      }}
    >
      {Math.abs(maxLeverage).toString() + "x"}{" "}
    </div>
  );

  let middle = Math.floor((maxLeverage + minLeverage) / 2);
  let low_middle = Math.floor((middle + minLeverage) / 2);
  let high_middle = Math.floor((middle + maxLeverage + 1) / 2);

  marks[middle] = (
    <div
      style={{
        color: middle >= 0 ? positiveColor : negativeColor,
        fontWeight: 900,
      }}
    >
      {Math.abs(middle).toString() + "x"}{" "}
    </div>
  );

  marks[low_middle] = (
    <div
      style={{
        color: low_middle >= 0 ? positiveColor : negativeColor,
        fontWeight: 900,
      }}
    >
      {Math.abs(low_middle).toString() + "x"}{" "}
    </div>
  );

  marks[high_middle] = (
    <div
      style={{
        color: high_middle >= 0 ? positiveColor : negativeColor,
        fontWeight: 900,
      }}
    >
      {Math.abs(high_middle).toString() + "x"}{" "}
    </div>
  );

  return (
    <Slider
      {...props}
      min={minLeverage ? minLeverage : 0.1}
      max={maxLeverage}
      marks={marks}
      step={0.1}
      range={true}
      defaultValue={defaultValue ? defaultValue : 1}
      included={true}
      handleRender={tipHandleRender}
      trackStyle={{
        backgroundColor:
          theme === "dark" ? "rgb(245, 245, 245)" : "rgb(71, 77, 87)",
        height: 4,
      }}
      railStyle={{
        backgroundColor:
          theme === "dark" ? "rgb(71, 77, 87)" : "rgb(220, 224, 229)",
        height: 4,
      }}
      dotStyle={(val) => {
        let fillColor = Number(val) >= 0 ? positiveColor : negativeColor;

        return {
          transform: "translateX(-50%) rotate(45deg)",
          backgroundColor: theme === "dark" ? fillColor : "rgb(255, 255, 255)",
          width: "10px",
          height: "10px",
          borderRadius: "2px",
          border:
            theme === "dark"
              ? "2px solid " + fillColor
              : "2px solid rgb(234, 236, 239)",
          overflow: "visible",
          cursor: "pointer",
          bottom: "-3px",
        };
      }}
      activeDotStyle={{
        transform: "translateX(-50%) rotate(45deg)",
        backgroundColor:
          theme === "dark" ? "rgb(183, 189, 198)" : "rgb(71, 77, 87)",
        width: "10px",
        height: "10px",
        borderRadius: "2px",
        border:
          theme === "dark"
            ? "2px solid #131722"
            : "2px solid rgb(255, 255, 255)",
        zIndex: 12,
        overflow: "visible",
        cursor: "pointer",
      }}
      handleStyle={{
        width: "16px",
        height: "16px",
        transform: "translateX(-50%) rotate(45deg)",
        backgroundColor: theme === "dark" ? "#131722" : "rgb(255, 255, 255)",
        opacity: 1,
        borderRadius: "4px",
        border:
          theme === "dark"
            ? "4px solid rgb(245, 245, 245)"
            : "4px solid rgb(71, 77, 87)",
        zIndex: 20,
        cursor: "grab",
        transition: "box-shadow 0.2s ease 0s",
        boxShadow: "none",
      }}
    />
  );
};

export default TooltipPerpetualSlider;
