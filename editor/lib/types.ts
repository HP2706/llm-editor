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

export interface LogProbs {
  token : string, 
  prob : number, // prob between 0 and 1
  color : [number, number, number, number] // rgba
}

export interface LogProbsResponse {
  data : LogProbs[]
}

export interface LogProbRequest {
  prompt : string
  idx : number
}
