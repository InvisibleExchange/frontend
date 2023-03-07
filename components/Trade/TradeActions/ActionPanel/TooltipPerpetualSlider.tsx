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
  tipFormatter?: (value: number) => React.ReactNode;
}) => {
  const {
    value,
    children,
    visible,
    tipFormatter = (val) => `${val}`,
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
      overlay={tipFormatter(value)}
      overlayInnerStyle={{ minHeight: "auto" }}
      ref={tooltipRef}
      visible={visible}
      {...restProps}
    >
      {children}
    </Tooltip>
  );
};

export const handleRender: SliderProps["handleRender"] = (node, props) => {
  return (
    <HandleTooltip value={props.value} visible={props.dragging}>
      {node}
    </HandleTooltip>
  );
};

const TooltipPerpetualSlider = ({
  tipFormatter,
  tipProps,
  maxLeverage,
  ...props
}: SliderProps & {
  tipFormatter?: (value: number) => React.ReactNode;
  tipProps: any;
  maxLeverage: number;
}) => {
  const { theme } = React.useContext(ThemeContext);

  const tipHandleRender: SliderProps["handleRender"] = (node, handleProps) => {
    return (
      <HandleTooltip
        value={handleProps.value}
        visible={handleProps.dragging}
        tipFormatter={tipFormatter}
        {...tipProps}
      >
        {node}
      </HandleTooltip>
    );
  };

  let marks = { 0.1: "0.1x" };
  marks[maxLeverage] = maxLeverage.toString() + "x";

  let middle = Math.floor(maxLeverage / 2);
  let low_middle = Math.floor(middle / 2);
  let high_middle = Math.floor((middle + maxLeverage) / 2);

  marks[middle] = middle.toString() + "x";
  marks[low_middle] = low_middle.toString() + "x";
  marks[high_middle] = high_middle.toString() + "x";

  return (
    <Slider
      {...props}
      min={0.1}
      max={maxLeverage}
      marks={marks}
      step={0.1}
      range={true}
      defaultValue={1}
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
      dotStyle={{
        transform: "translateX(-50%) rotate(45deg)",
        backgroundColor:
          theme === "dark" ? "rgb(24, 26, 32)" : "rgb(255, 255, 255)",
        width: "10px",
        height: "10px",
        borderRadius: "2px",
        border:
          theme === "dark"
            ? "2px solid rgb(71, 77, 87)"
            : "2px solid rgb(234, 236, 239)",
        overflow: "visible",
        cursor: "pointer",
        bottom: "-3px",
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
