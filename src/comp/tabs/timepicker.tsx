import React from "react";
import TimePicker from "react-time-picker";

type Value = string | Date | null | undefined;

interface MyTimePickerProps {
  value: Value;
  onChange: (value: Value) => void;
}

const MyTimePicker: React.FC<MyTimePickerProps> = ({ value, onChange }) => {
  return (
    <div className="w-full">
      <TimePicker
        onChange={onChange}
        value={value}
        disableClock={true}
        clearIcon={null}
        hourPlaceholder="hh"
        minutePlaceholder="mm"
        format="h:mm a"
        locale="en-US"
        className="w-full text-lg p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        // Add this inline styling to target shadow DOM elements if necessary
        // style={{
        //   fontSize: "1rem",
        //   height: "2.5rem",
        //   width: "100%",
        //   padding: "0.5rem",
        //   boxSizing: "border-box",
        // }}
      />
    </div>
  );
};

export default MyTimePicker;
