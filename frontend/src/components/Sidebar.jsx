import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MdDelete, MdWater, MdPark, MdHome } from "react-icons/md";

export default function Sidebar({ onScan, filters, setFilters }) {
  const [open, setOpen] = useState(true);

  const icons = {
    waste: <MdDelete size={20} />,
    water: <MdWater size={20} />,
    vegetation: <MdPark size={20} />,
    rooftop: <MdHome size={20} />,
  };

  const toggleFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      className={`absolute top-0 left-0 z-50 transition-all duration-300
      ${open ? "w-80" : "w-16"}
      h-full bg-[#0f1115] text-white shadow-2xl border-r border-neutral-800`}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-4 top-4 h-9 w-9 rounded-full
        bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center
        border border-neutral-700 shadow-md transition"
      >
        {open ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
      </button>

      {/* Expanded Panel */}
      {open ? (
        <div className="p-6 flex flex-col h-full gap-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold tracking-wide">SHARA</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Satellite Health & Analysis
            </p>
          </div>

          {/* Scan Button */}
          <button
            onClick={onScan}
            className="py-3 text-lg rounded-xl bg-green-500 hover:bg-green-600 
            shadow-lg w-full font-semibold transition"
          >
            Scan Area
          </button>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Filters</h3>

            <div className="flex flex-col gap-3">
              {Object.keys(filters).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg 
                  hover:bg-neutral-700 border border-neutral-700 cursor-pointer transition"
                >
                  {icons[key]}
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={() => toggleFilter(key)}
                    className="w-4 h-4 accent-green-400"
                  />
                  <span className="capitalize text-sm">{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Extra spacing */}
          <div className="flex-grow" />

          {/* Footer */}
          <div className="text-neutral-500 text-xs">
            © SHARA — Powered by ESRI & MapLibre
          </div>
        </div>
      ) : (
        // Collapsed mode (icons only)
        <div className="flex flex-col items-center gap-6 pt-20">
          {Object.keys(filters).map((key) => (
            <div key={key} className="text-neutral-400 hover:text-white cursor-pointer">
              {icons[key]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
