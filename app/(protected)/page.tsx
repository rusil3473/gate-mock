"use client";

import NavBar from "@/components/NavBar";
import Papercard from "@/components/PaperCard";
import { Paper } from "@/types/appType";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const getPapers = async () => {
    try {
      const result = await axios.get("/api/paper");

      setPapers(result.data.papers);
    } catch (error) {}
  };

  useEffect(() => {
    getPapers();
  }, []);
  return (
    <>
      <NavBar path="/" />
      <div className="flex flex-row flex-wrap justify-center">
        {papers.length > 0
          ? papers.map((obj, i) => {
              return (
                <Papercard
                  key={i}
                  year={obj.year}
                  set={obj.set}
                  branch={obj.branch}
                ></Papercard>
              );
            })
          : null}
      </div>
    </>
  );
}
