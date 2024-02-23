import { TextNode } from "lexical";

export interface nodeContext {
  node : TextNode,
  index : number
}

export interface Edit {
  quote : string,
  explanation? : string, 
  proposed_edit : string
}

export interface LogProb {
  token : string, 
  idx : number,
  prob : number, // prob between 0 and 1
  color : [number, number, number, number] // rgba
}

export interface LogProbsResponse {
  data : LogProb[]
}

export interface LogProbRequest {
  prompt : string
  idx : number
}
