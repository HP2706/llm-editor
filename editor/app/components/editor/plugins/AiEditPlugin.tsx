// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import '@/app/styles/MarkDownEditorNode.css';

import { $createTextNode, $getNodeByKey, $getRoot, $getSelection, ElementNode, LexicalEditor, LexicalNode, SerializedElementNode, SerializedTextNode } from "lexical";
import { Edit, nodeContext } from "@/lib/types";
import { captureText, collectAllNodes, findNode, matchString } from "../editorUtils";

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
          addTextButton(editor, node, edit);
        }
      }
    }
  }
}

function applyAllEdits(editor : LexicalEditor) {
  editor.update(() => {
    const root = $getRoot();
    const allTextNodes = collectAllNodes(root);
    for (let node of allTextNodes) {
      if (node instanceof ButtonTextNode) {
        console.log("applying edit");
        applyEdit(editor, node);
      }
    }
  });
}

export const ApplyAllButtonNodes =  ({editor} : {editor : LexicalEditor}) => {
  return (
      <div>
          <button
          onClick={() => {
              applyAllEdits(editor);
          }}
          className={"toolbar-item spaced"}
          aria-label="Format Strikethrough"
          >
            <i className="format ai-magic" /> {/* TODO new icon*/}
        </button>
      </div>    
  )
}

function addTextButton(editor : LexicalEditor, nodecontext : nodeContext, edit : Edit) {
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
      const buttonTextNode = new ButtonTextNode(edit, editor);
      console.log("buttonTextNode type", buttonTextNode.getType());
      midNode.replace(buttonTextNode);
    
      } else {
        console.error("No parent node found");
      }
  });
}

function applyEdit(editor : LexicalEditor, node : ButtonTextNode) {
  editor.update(() => {
    node.replace($createTextNode(node.proposed_edit));
  });
}


interface SerializedButtonTextNode extends SerializedTextNode {
  type: 'editabletext';
  text: string;
  edit: Edit;
  editor : LexicalEditor;
}

export class ButtonTextNode extends TextNode {
  private edit: Edit;
  public proposed_edit : string;
  private editor : LexicalEditor;

  static getType(): string {
    return 'buttonTextNode';
  }

  static clone(node: ButtonTextNode): ButtonTextNode {
    return new ButtonTextNode(node.edit, node.editor);
  }

  constructor(edit : Edit, editor : LexicalEditor) {
    super(edit.quote);
    this.__text = edit.quote;
    this.proposed_edit = edit.proposed_edit;
    this.edit = edit;
    this.editor = editor;
  }



  static importJSON(serializedNode: SerializedButtonTextNode): ButtonTextNode {
    const { text, edit, editor } = serializedNode;
    const node = new ButtonTextNode(edit, editor);
    return node;
  }
  // Implement the exportJSON method
  exportJSON(): SerializedButtonTextNode {
    return {
      ...super.exportJSON(), // Spread the base properties
      type: 'editabletext',
      text: this.__text,
      edit: this.edit,
      editor : this.editor
    };
  }

  createDOM(config: unknown): HTMLElement {
    // Create the text content
    const textContent = document.createElement('span');
    textContent.textContent = this.edit.proposed_edit; // Display the current text
    textContent.style.color = 'red';
    textContent.className = 'editable-text-node'; // Add class for styling

    // Create the edit button
    const button = document.createElement('button');
    button.textContent = this.edit.proposed_edit; // Set button label
    button.className = 'edit-button'; // Add class for styling
    button.style.display = 'inline'; // Hide the button initially
    button.onclick = () => {
      
      applyEdit(this.editor, this);
    };

    // Append the button to the textContent span
    textContent.appendChild(button);

    // Show the button on hover of the textContent
    textContent.onmouseover = () => {
      button.style.display = 'inline'; // Show the button
    };
    textContent.onmouseout = () => {
      button.style.display = 'none'; // Hide the button
    };

    return textContent;
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