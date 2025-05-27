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
        maxHeight: "320px",
        overflowY: "auto",
        padding: "8px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        borderRadius: "12px",
        zIndex: 9999,
      }}
    >
      {filteredData.length === 0 && (
        <div
          style={{
            padding: "8px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          No matches found.
        </div>
      )}
      {filteredData.map((item, index) => (
        <div
          key={index}
          onClick={() => fillForm(item)}
          style={{
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: "1px solid",
            borderColor:
              highlightIndex === index ? "#60a5fa" : "#e5e7eb",
            backgroundColor:
              highlightIndex === index ? "#dbeafe" : "#ffffff",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
        >
          {displayFields.map((field, i) => (
            <div key={i} style={{ fontSize: "14px", color: "#374151" }}>
              <span style={{ fontWeight: "600", color: "#1f2937" }}>
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
