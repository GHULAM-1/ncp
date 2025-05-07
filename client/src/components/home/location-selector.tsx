"use client";
import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { LocationSelectorProps } from "@/types/location-selector-type";
const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocation,
}) => {
  return (
    <div className="flex justify-between items-center mb-4 dark:text-white">
      <h2 className="text-2xl  font-medium">Your local news</h2>

      <div className="flex items-center">
        <button className="hover:text-gray-900 transition-colors flex items-center gap-1">
          <HelpCircle size={18} />
          <span className="text-sm">Why these locations?</span>
        </button>
      </div>
    </div>
  );
};

export default LocationSelector;
