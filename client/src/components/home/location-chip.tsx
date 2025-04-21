import React from "react";
import { LocationChipProps } from "@/types/location-chip-prop-type";
const LocationChip: React.FC<LocationChipProps> = ({ name, active }) => {
  return (
    <div
      className={`px-4 py-2 rounded-full cursor-pointer transition-colors ${
        active
          ? "bg-gray-100 text-gray-900"
          : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {name}
    </div>
  );
};

export default LocationChip;
