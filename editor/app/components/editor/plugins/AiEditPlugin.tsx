// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import '@/app/styles/MarkdownEditorNode.css';
import '@/app/styles/globals.css';

import { $createTextNode, $getNodeByKey, $getRoot, $getSelection, ElementNode, LexicalEditor, LexicalNode, SerializedElementNode, SerializedTextNode } from "lexical";
import { Edit, nodeContext } from "@/lib/types";
import { captureText, checkContainsButtonNode, collectAllNodes, findNode, matchString } from "../editorUtils";

import { ButtonTextNode } from './nodeExtensions';
import { TextNode } from "lexical";

export async function SteamAiEdits(editor: LexicalEditor) {
  const mytext = await captureText(editor);

  const host = process.env.MODAL_BACKEND_URL || process.env.NEXT_PUBLIC_MODAL_BACKEND_URL;
  const endpoint = `${host}/api/editDoc`;
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

  
  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, {stream: true});
      const edits: Edit[] = chunk.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  
      for (let edit of edits) {
        const matchingNodes = await matchString(editor, edit.quote);
        for (let node of matchingNodes) {
          addTextButton(editor, node, edit);
        }
      }
    }
  }
}

export function addTextButton(editor : LexicalEditor, nodecontext : nodeContext, edit : Edit) {
  const { node, index } = nodecontext;
  console.log("nodecontext", nodecontext);
  console.log("edit", edit);
  editor.update(() => {
    
    const root = $getRoot();
    const allTextNodes = root.getAllTextNodes();
    const currentNode = findNode(node, allTextNodes) as TextNode;
    
    if (currentNode) {
      if (index === 0){ // if index is 0 it means that the entire textnode should be replaced
        const buttonTextNode = new ButtonTextNode(edit, editor);
        console.log("buttonTextNode type", buttonTextNode.getType());
        node.replace(buttonTextNode);
      } else {
        const [leftNode, restNode] = currentNode.splitText(index);
        const [midNode, rightNode] = restNode.splitText(edit.quote.length);
        console.log("leftNode", leftNode);
        console.log("midNode", midNode);
        console.log("rightNode", rightNode);

        // Apply style to the midNode which contains the quote
        const buttonTextNode = new ButtonTextNode(edit, editor);
        console.log("buttonTextNode type", buttonTextNode.getType());
        midNode.replace(buttonTextNode);
      }
    } else {
      console.error("No parent node found");
    }
  });
}

export function applyEdit(editor : LexicalEditor, node : ButtonTextNode) {
  editor.update(() => {
    node.replace($createTextNode(node.proposed_edit));
  });
}



export function applyAllEdits(editor : LexicalEditor) {
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


