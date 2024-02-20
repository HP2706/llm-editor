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