import { useEffect, useState, useCallback } from "react";
import { BiUpArrow, BiDownArrow } from "react-icons/bi";

const repeatDelay = 500;
const repeatFrequency = 50;
let timeoutId: number | undefined;

const NumberBox = ({
  value,
  fieldName,
  max,
  min,
  calculateMax,
  calculateMin,
  onChange,
}: {
  value: number;
  fieldName?: string;
  max?: number;
  min?: number;
  calculateMax?: () => number;
  calculateMin?: () => number;
  onChange: (value: number, fieldName: string | undefined) => void;
}) => {
  const [incrementPressed, setIncrementPressed] = useState(false);
  const [decrementPressed, setDecrementPressed] = useState(false);
  const [repeatDelayCompleted, setRepeatDelayCompleted] = useState(false);

  const onChangeFn = useCallback(
    (x: any) => onChange(x.target.value, fieldName),
    [fieldName, onChange]
  );

  const onIncrement = useCallback(
    (oldValue: number) => {
      const maxValue = max || (calculateMax && calculateMax());
      const x = maxValue && oldValue + 10 > maxValue ? maxValue : oldValue + 10;
      onChange(x, fieldName);
    },
    [fieldName, max, calculateMax, onChange]
  );

  const onDecrement = useCallback(
    (oldValue: number) => {
      const minValue = min || (calculateMin && calculateMin());
      const x = minValue && oldValue - 10 < minValue ? minValue : oldValue - 10;
      onChange(x, fieldName);
    },
    [fieldName, min, calculateMin, onChange]
  );

  const onClickIncrement = useCallback(() => {
    onIncrement(value);
  }, [value, onIncrement]);

  const onClickDecrement = useCallback(() => {
    onDecrement(value);
  }, [value, onDecrement]);

  useEffect(() => {
    const fn = () => {
      setIncrementPressed(false);
      setDecrementPressed(false);
      setRepeatDelayCompleted(false);
      clearTimeout(timeoutId);
    };
    window.addEventListener("mouseup", fn);
    window.addEventListener("touchend", fn);
    return () => {
      window.removeEventListener("mouseup", fn);
      window.removeEventListener("touchend", fn);
    };
  }, []);

  useEffect(() => {
    if (repeatDelayCompleted && incrementPressed) {
      setTimeout(() => onIncrement(value), repeatFrequency);
    }
    if (repeatDelayCompleted && decrementPressed) {
      setTimeout(() => onDecrement(value), repeatFrequency);
    }
  }, [
    value,
    incrementPressed,
    decrementPressed,
    repeatDelayCompleted,
    onIncrement,
    onDecrement,
  ]);

  const onPressIncrement = useCallback(() => {
    setIncrementPressed(true);
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(
      () => setRepeatDelayCompleted(true),
      repeatDelay
    );
  }, []);

  const onPressDecrement = useCallback(() => {
    setDecrementPressed(true);
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(
      () => setRepeatDelayCompleted(true),
      repeatDelay
    );
  }, []);

  return (
    <div className="flex">
      <input
        className="w-10 border h-6 text-xs text-center"
        value={value}
        onChange={onChangeFn}
      />
      <div className="flex flex-col text-[8px] justify-between border">
        <div
          className="flex justify-center items-center grow active:bg-zinc-200"
          onClick={onClickIncrement}
          onMouseDown={onPressIncrement}
          onTouchStart={onPressIncrement}
        >
          <BiUpArrow />
        </div>
        <div className="border w-3"></div>
        <button
          className="flex justify-center items-center grow active:bg-zinc-200"
          onClick={onClickDecrement}
          onMouseDown={onPressDecrement}
          onTouchStart={onPressDecrement}
        >
          <BiDownArrow />
        </button>
      </div>
    </div>
  );
};

export default NumberBox;
