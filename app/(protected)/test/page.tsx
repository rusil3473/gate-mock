"use client";
import { useEffect } from "react";

export default function Test() {
  useEffect(() => {
    history.pushState(null, location.href);
    const ele = document.documentElement;
    const handleVisiblityChange = async () => {
      if (document.hidden) {
        console.warn("Tab Switched NO MERCY Test is submitted");
        //TO-Do answer submit
      }
    };
    const handleBlur = async () => {
      console.warn("Tab Switched NO MERCY Test is submitted");
      //TO-Do answer submit
    };
    const handleExit = async () => {
      if (!document.fullscreenElement) {
        const isSubmit = window.confirm(
          "Are you sure you want to exit & submit ?"
        );
        if (!isSubmit) {
          await ele.requestFullscreen();
        }
        //TO-Do answer submit
      }
    };
    document.addEventListener("fullscreenchange", handleExit);
    document.addEventListener("visibilitychange", handleVisiblityChange);
    document.addEventListener("blur", handleVisiblityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleExit);
      document.removeEventListener("visibilitychange", handleVisiblityChange);
      document.removeEventListener("blur", handleVisiblityChange);
    };
  }, []);
  return <>Hello</>;
}
