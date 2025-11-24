import React, { useCallback, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import useClickOutside from "./useClickOutside";
import "./PopoverPicker.css";

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}
/**
 * PopoverPicker component: renders a button that displays an advanced selector for colors.
 *
 * @example
 * <PopoverPicker color={color} onChange={setColor } />
 *
 * @param color 
 * @param onChange
 */

export const PopoverPicker: React.FC<PopoverPickerProps> = ({ color, onChange }) => {
  const popover = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(popover, close);

  return (
    <div className="picker">
      <div
        className="swatch"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="popover" ref={popover}>
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
};
