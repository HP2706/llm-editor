// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import { $createTextNode, $getRoot, $getSelection, ElementNode, LexicalEditor } from "lexical";
import { captureText, matchString } from "../editorUtils";

import { TextNode } from "lexical";

interface Edit {
  quote : string,
  proposed_edit : string,
  explanation? : string
}

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
        for (let node of matchingNodes) {
          console.log("applying edit", ((new Date().getTime() - currenttime.getTime()) / 1000));
          splitNode(editor, node, edit);
        }
      }
    }
  }
}

function splitNode(editor : LexicalEditor, node : TextNode, edit : Edit) {
  // Apply the edit to the node
  // For demonstration, let's change the text of the node to the proposed edit
  editor.update(() => {
    let text = node.getTextContent();
    
    let index = text.indexOf(edit.quote);
    if (index === -1) {
      return;
    }
  
    const parentNode = node.getParent();
    if (parentNode) {
      console.log("Node count before split and style:", parentNode.getChildren().length);
      // Insert the new nodes at the position of the old node
      const [leftNode, restNode] = node.splitText(index);
      // Split the restNode at the end of the quote to isolate the quote
      const [midNode, rightNode] = restNode.splitText(edit.quote.length);
  
      // Apply style to the midNode which contains the quote
      midNode.setStyle("background-color: yellow;");
      
    } else {
      console.error("No parent node found");
    }
  });
  
  
}


const editButton = (suggested_edit : string, explanation : string, func : () => void) => {
  return (
    <div className="edit-button" onClick={func}>
      <div className="suggested-edit tooltip">{suggested_edit}</div>
      <div className="explanation tooltip">{explanation}</div>
    </div>
  );
}; 

interface Edit {
  quote : string,
  explanation? : string, 
  proposed_edit : string
}

class EditableTextNode extends ElementNode {
  static getType() {
    return 'editabletext';
  }

  static clone(node) {
    return new EditableTextNode(node.__text, node.__key);
  }

  constructor(text) {
    super();
    this.__text = text;
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.style.position = 'relative';
    return div;
  }

  updateDOM() {
    return false;
  }

  append(...nodes) {
    super.append(...nodes);
    if (this.__text !== undefined) {
      const textNode = $createTextNode(this.__text);
      super.append(textNode);
    }
  }

  // Method to append the edit button
  appendEditButton(editor: LexicalEditor, edit: Edit) {
    const button = document.createElement('button');
    button.textContent = 'Edit';
    button.onclick = () => {
      // Define what happens when the button is clicked
      console.log('Edit button clicked');
    };
    this.getDOM().appendChild(button);
  }
}