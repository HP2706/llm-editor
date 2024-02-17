// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import { captureText, matchString } from "../editorUtils";

import { LexicalEditor } from "lexical";
import { TextNode } from "lexical";
import { registerCodeHighlighting } from "@lexical/code";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function SteamAiEdits(editor : LexicalEditor) {
    captureText(editor).then( async (mytext :string) => {
      // Correct the condition to check if the text is actually empty
      if (mytext === ""){
        console.log("mytext captured was empty");
        return;
      }
      console.log("mytext captured", mytext);

      const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
      const endpoint = `${host}/api/editDoc`;
      console.log(endpoint);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json', // Specify the content type as JSON
        },
        body: JSON.stringify({
            text : mytext,
            useAsync : false
        }),
      });

      console.log(response);

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        reader.read().then(function processText({ done, value }) {
          if (done) {
            console.log("Stream complete");
            return;
          }
          // Process the chunk
          const chunk = decoder.decode(value, { stream: true });
          console.log("Received chunk", chunk);
          const edits = chunk.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
          edits.forEach(edit => {
            console.log("edit", edit);
            matchString(editor, edit.text)?.then((matchingNodes) => {
              console.log("matchingNodes", matchingNodes);
            });
          });
          // applyEditToEditor(edit);

          // Read the next chunk
          reader.read().then(processText);
        });
      }
    });
  return null;    
} 


// the lexical node


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