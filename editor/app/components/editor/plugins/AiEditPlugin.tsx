// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import { captureText, matchString } from "../editorUtils";

import { LexicalEditor } from "lexical";
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
    console.log("response time", ((new Date().getTime() - currenttime.getTime()) / 1000));
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, {stream: true});
      const edits: Edit[] = chunk.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      
      console.log("time to chunk in seconds", ((new Date().getTime() - currenttime.getTime()) / 1000));
      console.log("edits", edits);
      for (let edit of edits) {
        const matchingNodes = await matchString(editor, edit.quote);
        for (let node of matchingNodes) {
          console.log("applying edit", ((new Date().getTime() - currenttime.getTime()) / 1000));
          applyAIEdit(editor, node, edit);
        }
      }
    }
  }
  
}

function applyAIEdit(editor : LexicalEditor, node : TextNode, edit : Edit) {
  // Apply the edit to the node
  // For demonstration, let's change the text of the node to the proposed edit
  editor.update(() => {
    let text = node.getTextContent();
    let index = text.indexOf(edit.quote);
    if (index === -1) {
      return;
    }
    let newText = text.slice(0, index) + edit.proposed_edit + text.slice(index + edit.quote.length);
    node.setTextContent(newText); 
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

// this is not working properly yet.
class HighlightTextNode extends TextNode {
  constructor(text: string) {
    super(text);
  }

  static getType() {
    return 'highlighttextnode';
  }

  static clone(node: HighlightTextNode) {
    return new HighlightTextNode(node.__text);
  }

  createDOM(config: any) {
    const span = document.createElement('span');
    span.textContent = this.getTextContent();
    
    // this doesn't work yet
    /* const buttonElement = editButton('Highlight', 'Click to highlight text', () => this.applyHighlight(span as Node));
    span.appendChild(buttonElement); */
    
    return span;
}

  updateDOM(prevNode: any, dom: any) {
    // Ensure the button is correctly targeted and the span is passed to applyHighlight
    const button = dom.querySelector('.edit-button'); // Ensure this selector matches your button's class
    button.onclick = () => this.applyHighlight(dom);
    return true;
  }

  applyHighlight(domElement: HTMLElement) {
    // Directly apply styles to the DOM element for highlighting
    // For demonstration, let's change the background color of the entire text node
    domElement.style.backgroundColor = 'yellow';
  }
}