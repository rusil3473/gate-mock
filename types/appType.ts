export type Paper = {
  year: number;
  set: number;
  branch: string;
};
// types/question.ts
export interface IQuestion {
  _id: string; // Serialized from ObjectId
  QuesNo: number;
  Ques: string;
  Quetype: string;
  options: Record<string, string>; // Mongoose Map -> JSON Object
  subject: string;
  ans: string | string[] | number; // Schema.Types.Mixed
  basedonImage: boolean;
  ImageUrl?: string;
  year: number;
  set: number;
  pos: number;
  neg: number;
}

export interface FQuestion {
  QuesNo: number;
  Ques: string;
  Quetype: string;
  options: Record<string, string>; // Mongoose Map -> JSON Object
  basedonImage: boolean;
  ImageUrl?: string;
  year: number;
  set: number;
  pos: number;
}
