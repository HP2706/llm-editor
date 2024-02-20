// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import { $createTextNode, $getRoot, $getSelection, ElementNode, LexicalEditor, SerializedElementNode, SerializedTextNode } from "lexical";
import { Edit, nodeContext } from "@/lib/types";
import { captureText, findNode, matchString } from "../editorUtils";

import { TextNode } from "lexical";
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

export async function SteamAiEdits(editor: LexicalEditor) {
  const mytext = await captureText(editor);

  const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
  const endpoint = `${host}/api/editDoc`;
  console.log(endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: mytext,
      useAsync: false
    }),
  });

  let currenttime = new Date();

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, {stream: true});
      const edits: Edit[] = chunk.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  
      console.log("edits", edits);
      for (let edit of edits) {
        const matchingNodes = await matchString(editor, edit.quote);
        console.log("n matching nodes", matchingNodes.length);
        for (let node of matchingNodes) {
          addButtonDecorator(editor, node, edit);
        }
      }
    }
  }
}

function addButtonDecorator(editor : LexicalEditor, nodecontext : nodeContext, edit : Edit) {
  const { node, index } = nodecontext;
  
  
  editor.update(() => {
    
    const root = $getRoot();
    const allTextNodes = root.getAllTextNodes();
    const currentNode = findNode(node, allTextNodes) as TextNode;
    
    if (currentNode) {
  
      const [leftNode, restNode] = currentNode.splitText(index);
      const [midNode, rightNode] = restNode.splitText(edit.quote.length);
      console.log("leftNode", leftNode);
      console.log("midNode", midNode);
      console.log("rightNode", rightNode);

      // Apply style to the midNode which contains the quote
      const buttonTextNode = new ButtonTextNode(edit);
      console.log("buttonTextNode type", buttonTextNode.getType());
      midNode.replace(buttonTextNode);
    
      } else {
        console.error("No parent node found");
      }
  });
}



export class ButtonTextNode extends TextNode {
  private edit: Edit;

  static getType(): string {
    return 'buttonTextNode';
  }

  static clone(node: ButtonTextNode): ButtonTextNode {
    return new ButtonTextNode(node.edit);
  }

  constructor(edit : Edit) {
    super(edit.quote);
    this.__text = edit.proposed_edit;
    this.edit = edit;
  }

  // Override the render method to include a button
  render() {
    const tooltipStyle = {
      position: 'relative' as 'relative',
      display: 'inline-block',
    };
  
    const tooltipTextStyle = {
      visibility: 'hidden' as 'hidden',
      width: '120px',
      backgroundColor: 'black',
      color: '#fff',
      textAlign: 'center' as 'center',
      borderRadius: '6px',
      padding: '5px 0',
      position: 'absolute' as 'absolute',
      zIndex: '1',
      bottom: '100%',
      left: '50%',
      marginLeft: '-60px', 
      opacity: '0',
      transition: 'opacity 0.3s'
    };
  
    const tooltipTextHoverStyle = {
      visibility: 'visible',
      opacity: '1'
    };
  
    return (
      <span style={tooltipStyle}>
        {this.edit.proposed_edit}
        <span style={tooltipTextStyle} className="tooltipText">{this.edit.explanation}</span>
        <button onClick={this.applyEdit}>Click me</button>
        <style>
          {`
            .tooltip:hover .tooltipText {
              visibility: visible;
              opacity: 1;
            }
          `}
        </style>
      </span>
    );
  }

  createDOM(config: unknown): HTMLElement {
    const div = document.createElement('div');
    div.style.position = 'relative';
    
    // Create the edit button
    const button = document.createElement('button');
    button.textContent = 'Edit';
    button.onclick = () => {
      this.__text = this.edit.proposed_edit;
      console.log("edit applied");
    };
    
    // Mimic the structure of editButton
    
    // this is degenerate find another way to do this
    const editButtonDiv = document.createElement('div');
    editButtonDiv.className = "edit-button";
    editButtonDiv.appendChild(button);
  
    const suggestedEditDiv = document.createElement('div');
    suggestedEditDiv.className = "suggested-edit tooltip";
    suggestedEditDiv.textContent = this.edit.proposed_edit;
    editButtonDiv.appendChild(suggestedEditDiv);
  
    if (this.edit.explanation) {
      const explanationDiv = document.createElement('div');
      explanationDiv.className = "explanation tooltip";
      explanationDiv.textContent = this.edit.explanation;
      editButtonDiv.appendChild(explanationDiv);
    }
  
    div.appendChild(editButtonDiv);
    
    return div;
  }

  applyEdit() {
    this.__text = this.edit.proposed_edit;
    console.log("edit applied");
  }
}

export const AiEditButton =  ({editor, filename} : {editor : LexicalEditor, filename : string}) => {
  return (
      <div>
          <button
          onClick={() => {
              SteamAiEdits(editor);
          }}
          className={"toolbar-item spaced" + (filename ? "active" : "")}
          aria-label="Format Strikethrough"
          >
            <i className="format ai-magic" />
        </button>
      </div>    
  )
}
