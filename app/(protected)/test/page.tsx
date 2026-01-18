"use client";
import NavBar from "@/components/NavBar";
import { useAns, useQuestion } from "@/store/QuestionStore";
import { FQuestion } from "@/types/appType";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Test() {
  const { questions } = useQuestion() as { questions: FQuestion[] };
  const [currQuestionNo, setCurrQuestionNo] = useState<number>(1);
  const [currQuestion, setCurrQuestion] = useState<FQuestion>(
    questions[currQuestionNo - 1]
  );
  const { answers, setAnswers } = useAns() as {
    answers: Record<string, string | string[]>;
    setAnswers: (key: string, value: string) => void;
  };

  const [ans, setAns] = useState(answers);
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
  console.log(ans);
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
                          {Object.entries(currQuestion.options).map(
                            ([key, value]) => (
                              <div key={key} className="flex my-2 mx-2 gap-2">
                                <label htmlFor={key} className="font-bold">
                                  {key}
                                </label>
                                <input
                                  type="radio"
                                  id={key}
                                  value={value}
                                  checked={
                                    ans[currQuestion.QuesNo.toString()] === key
                                  }
                                  name={currQuestion.QuesNo.toString()}
                                  onChange={() => {
                                    setAns({
                                      ...ans,
                                      [currQuestion.QuesNo.toString()]: key,
                                    });
                                    console.log(ans);
                                  }}
                                />
                                <label htmlFor={value}>{value}</label>
                              </div>
                            )
                          )}
                        </div>
                      );

                    case "MSQ":
                      const currSelection =
                        typeof ans[currQuestionNo] === "object"
                          ? ans[currQuestionNo]
                          : [];
                      return (
                        <div>
                          {Object.entries(currQuestion.options).map(
                            ([key, value]) => (
                              <div key={key} className="flex my-2 mx-2 gap-2">
                                <label htmlFor={key} className="font-bold">
                                  {key}
                                </label>
                                <input
                                  type="checkbox"
                                  id={key}
                                  value={value}
                                  checked={(
                                    ans[currQuestion.QuesNo.toString()] || []
                                  ).includes(key)}
                                  name={currQuestion.QuesNo.toString()}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...currSelection, key]
                                      : currSelection.filter(
                                          (item) => item !== key
                                        );
                                    console.log(updated);
                                    setAns((s) => ({
                                      ...s,
                                      [currQuestion.QuesNo.toString()]: updated,
                                    }));
                                  }}
                                />
                                <label htmlFor={value}>{value}</label>
                              </div>
                            )
                          )}
                        </div>
                      );

                    case "NAT":
                      return (
                        <div className="w-full">
                          <input
                            type="number"
                            id="NAT"
                            name={currQuestion.QuesNo.toString()}
                            className="bg-yellow-50"
                            onWheel={(e) =>
                              (e.target as HTMLInputElement).blur()
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "ArrowUp" ||
                                e.key === "ArrowDown"
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              setAns((s) => ({
                                ...s,
                                [currQuestion.QuesNo]: e.target.valueAsNumber,
                              }));
                            }}
                          />
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
                    key={a.QuesNo}
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
