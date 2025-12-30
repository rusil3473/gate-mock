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
  ans: any; // Schema.Types.Mixed
  basedonImage: boolean;
  ImageUrl?: string;
  year: number;
  set: number;
  pos: number;
  neg: number;
}
