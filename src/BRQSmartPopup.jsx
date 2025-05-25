import { useEffect, useRef, useState } from "react";
import React from 'react';

export default function BRQSmartPopup({
  api,
  dataKey,
  displayFields = [],
  bindFields = {},
}) {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [filterValue, setFilterValue] = useState("");
  const [activeField, setActiveField] = useState("");
  const popupRef = useRef(null);

  useEffect(() => {
    fetch(api)
      .then((res) => res.json())
      .then((json) => setData(json[dataKey] || []))
      .catch(console.error);
  }, [api, dataKey]);

  useEffect(() => {
    const listeners = [];

    const handleKeyDown = (e) => {
      if (!show) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filteredData.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + filteredData.length) % filteredData.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        fillForm(filteredData[highlightIndex]);
      } else if (e.key === "Escape") {
        setShow(false);
      }
    };

    Object.entries(bindFields).forEach(([fieldPath, controlId]) => {
      const input = document.getElementById(controlId);
      if (!input) return;

      const focusHandler = () => {
        const rect = input.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
        setActiveField(fieldPath);
        setFilterValue(input.value || "");
        setShow(true);
      };

      const inputHandler = (e) => {
        setFilterValue(e.target.value);
      };

      input.addEventListener("focus", focusHandler);
      input.addEventListener("keydown", handleKeyDown);
      input.addEventListener("input", inputHandler);

      listeners.push(() => {
        input.removeEventListener("focus", focusHandler);
        input.removeEventListener("keydown", handleKeyDown);
        input.removeEventListener("input", inputHandler);
      });
    });

    const outsideClick = (e) => {
      if (!popupRef.current?.contains(e.target)) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", outsideClick);

    return () => {
      listeners.forEach((off) => off());
      document.removeEventListener("mousedown", outsideClick);
    };
  }, [data, bindFields, show]);

  const getValueByPath = (obj, path) => {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
  };

  const fillForm = (item) => {
    Object.entries(bindFields).forEach(([field, controlId]) => {
      const input = document.getElementById(controlId);
      const value = getValueByPath(item, field);
      if (input && value !== undefined) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    setShow(false);
  };

  const filteredData = data.filter((item) => {
    const value = getValueByPath(item, activeField);
    return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
  });

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: position.top + 4,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
      className="max-h-80 overflow-y-auto space-y-2 p-2 bg-white border border-gray-200 shadow rounded-xl"
    >
      {filteredData.length === 0 && (
        <div className="p-2 text-gray-500 text-sm">No matches found.</div>
      )}
      {filteredData.map((item, index) => (
        <div
          key={index}
          onClick={() => fillForm(item)}
          className={`rounded-xl p-4 shadow cursor-pointer border transition ${
            highlightIndex === index
              ? "bg-blue-100 border-blue-400"
              : "bg-white hover:bg-gray-50 border-gray-200"
          }`}
        >
          {displayFields.map((field, i) => (
            <div key={i} className="text-sm text-gray-700">
              <span className="font-semibold text-gray-800">
                {field.split(".").pop()}:
              </span>{" "}
              {getValueByPath(item, field)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
