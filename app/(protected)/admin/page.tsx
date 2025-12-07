"use client";
import NavBar from "@/components/NavBar";
import React, { useState } from "react";

export default function page() {
  const [fileName, setFileName] = useState<String>("");
  const handleChnage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type == "application/pdf") {
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };
  return (
    <>
      <NavBar path={"admin"}></NavBar>

      <main className="flex my-5 mx-10 ">
        <div className="flex flex-row items-center w-full justify-between">
          <div className="text-3xl">All Test</div>
          <div className="flex justify-end bg-green-500 rounded-3xl text-white">
            <label
              htmlFor="file"
              className="flex flex-row items-center gap-2 p-3"
            >
              {fileName == "" ? (
                <>
                  <div className="text-2xl">+</div>
                  <div>Choose A file</div>
                </>
              ) : (
                fileName + " is Selected"
              )}
            </label>
            <input
              type="file"
              id="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleChnage}
            />
          </div>
        </div>
      </main>
    </>
  );
}
