"use client";
import NavBar from "@/components/NavBar";
import { useQuestion } from "@/store/QuestionStore";
import { FQuestion } from "@/types/appType";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Test() {
  const { questions } = useQuestion() as { questions: FQuestion[] };
  console.log(questions);
  const [currQuestionNo, setCurrQuestionNo] = useState<number>(1);
  const [currQuestion, setCurrQuestion] = useState<FQuestion>(
    questions[currQuestionNo - 1]
  );

  useEffect(() => {
    if (questions.length < 1) return;
    setCurrQuestion(questions[currQuestionNo - 1]);
  }, [currQuestionNo]);
  // TO-DO Until prod

  // useEffect(() => {
  //   history.pushState(null, location.href);
  //   const ele = document.documentElement;
  //   const handleVisiblityChange = async () => {
  //     if (document.hidden) {
  //       alert("Tab Switched NO MERCY Test is submitted");
  //       //TO-Do answer submit
  //     }
  //   };
  //   const handleBlur = async () => {
  //     alert("Tab Switched NO MERCY Test is submitted");
  //     //TO-Do answer submit
  //   };
  //   const handleExit = async () => {
  //     if (document.fullscreenElement) {
  //       const isSubmit = window.confirm(
  //         "Are you sure you want to exit & submit ?"
  //       );
  //       if (!isSubmit) {
  //         await ele.requestFullscreen();
  //       }
  //       //TO-Do answer submit
  //     }
  //   };
  //   document.addEventListener("fullscreenchange", handleExit);
  //   document.addEventListener("visibilitychange", handleVisiblityChange);
  //   document.addEventListener("blur", handleBlur);

  //   return () => {
  //     document.removeEventListener("fullscreenchange", handleExit);
  //     document.removeEventListener("visibilitychange", handleVisiblityChange);
  //     document.removeEventListener("blur", handleBlur);
  //   };
  // }, []);
  return (
    <div className="">
      {/* TO-DO may be profile pic & name {questions[currQuestion - 1].QuesNo} <NavBar path={"/test"}></NavBar> */}
      <div className="w-full flex felx-row">
        <div className="w-[75%] ">
          <div className="my-17 mx-5 ml-12">
            <div>
              <div className="mb-5 text-xl ">{currQuestion.QuesNo}.</div>
              <div className="flex flex-row justify-between w-full ml-3 ">
                <div className="font-bold text-xl">{currQuestion.Ques}</div>
              </div>
              <div className="flex justify-end">{currQuestion.pos} M</div>
              <div className="flex justify-center items-center">
                {currQuestion.basedonImage ? (
                  <Image src={currQuestion.ImageUrl as string} alt=""></Image>
                ) : null}
              </div>
              <div>
                {(() => {
                  switch (currQuestion.Quetype.toUpperCase()) {
                    case "MCQ":
                      return (
                        <div>
                          {(() => {
                            for (const [key, value] of Object.entries(
                              currQuestion.options
                            )) {
                              return (
                                <div>
                                  <label
                                    htmlFor={currQuestion.QuesNo.toString()}
                                    className="font-bold"
                                  >
                                    {key}
                                  </label>
                                  <input
                                    type="radio"
                                    id={currQuestion.QuesNo.toString()}
                                    value={value}
                                  />
                                  <label
                                    htmlFor={currQuestion.QuesNo.toString()}
                                  >
                                    {value}
                                  </label>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      );
                    default:
                      return null;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
        <div className="w-[25%] h-auto bg-blue-700">
          {/*
            TO-DO inside-outside side bar 
          <div className="absolute">
            <div className="relative right-4 text-2xl">{"<<"} </div>
          </div> */}
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-5 gap-5 my-7">
              {questions.map((a) => {
                return (
                  <button
                    className="w-[50px] h-[50px] flex justify-center items-center p-5 bg-yellow-200 "
                    onClick={() => {
                      setCurrQuestionNo(a.QuesNo);
                    }}
                  >
                    {a.QuesNo}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
