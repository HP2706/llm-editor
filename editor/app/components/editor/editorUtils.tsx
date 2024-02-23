import '@/app/styles/markdDownEditor.css';

import { $createParagraphNode, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, LexicalEditor, TextNode } from 'lexical';
import { ElementNode, LexicalNode } from 'lexical';
import { html_to_docx, html_to_markdown, lexical_to_html } from '@/lib/lexicalConversion';

import {ButtonTextNode} from '@/app/components/editor/plugins/nodeExtensions';
import { nodeContext } from '@/lib/types';
import { saveAs } from 'file-saver';

export async function export_file_from_LexicalState(editor: LexicalEditor, filename : string) {
  const download = async (editor: LexicalEditor, filename : string) => {
    const htmlstring = await lexical_to_html(editor);
    if (filename.endsWith('docx')) {
      //convert to html, then convert to docx
      const docx_blob = await html_to_docx(htmlstring);
      
      saveAs(docx_blob, filename);
    } else if (filename.endsWith('md') || filename.endsWith('txt')) {
      //convert to markdown
      const markdown_blob = await html_to_markdown(htmlstring);
      saveAs(markdown_blob, filename);
    }
  }
  editor.update(() => {
    download(editor, filename);
  });
}


export function captureText(editor: LexicalEditor): Promise<string> {
  return new Promise((resolve) => {
    editor.getEditorState().read( async () => {
      const root = $getRoot();
      let allText = '';
      root.getAllTextNodes().forEach((node : TextNode) => {
        if (node.isSimpleText()) {
          allText += node.getTextContent();
        }
      });
      await resolve(allText);
    });
  });
}

export function checkContainsButtonNode(editor : LexicalEditor) : boolean {
  return editor.getEditorState().read(() => {
    let allNodes = collectAllNodes($getRoot());
    for (const node of allNodes) {
      console.log("node IN checkContainsButtonNode", node.getType()) ;
      if (node.getType() === 'buttonTextNode') {
        return true;
      }
    }
    return false;
  });
}

//this function goes through the textnodes and checks if a substring is present then returns
// the node that contains the substring
export function matchString(editor: LexicalEditor, targetQuote: string): Promise<nodeContext[]>  {
  return new Promise(async (resolve) => {
    let matchingNodes : nodeContext[] = [];
    await editor.getEditorState().read(async () => {
      const root = $getRoot();
      const allTextNodes = root.getAllTextNodes();
      console.log("TextNodeCount", allTextNodes.length);
      for (const node of allTextNodes) {
        if (node.isSimpleText()) {
          let text = node.getTextContent();
          if (text.includes(targetQuote)) {
            console.log("matching node", node);
            console.log("matching text", text);
            console.log("index", text.indexOf(targetQuote));
            matchingNodes.push(
              {
                node : node, 
                index : text.indexOf(targetQuote)
              }
            );
          }
        }
      }
      console.log("matchingNodes count", matchingNodes.length);
    });
    await resolve(matchingNodes);
    if (matchingNodes.length > 0) {
      return matchingNodes;
    } else {
      return []
    }
  });
}

export const RGBA_TO_STRING = (rgba : [number, number, number, number]) : string => {
  return `#${rgba[0]}${rgba[1]}${rgba[2]}${rgba[3]}`;
}

export function collectAllNodes(node : LexicalNode, nodes : LexicalNode[] = []) : LexicalNode[] {
  nodes.push(node);
  if (node instanceof ElementNode) {
    const children = node.getChildren();
    for (const child of children) {
      collectAllNodes(child, nodes);
    } 
  } 
  return nodes;
}

export const findNode = (node : LexicalNode, nodes : LexicalNode[]) : (LexicalNode | null) => {
  for (const n of nodes) {
    if (n.getKey() === node.getKey()) {
      return n;
    }
  }
  return null;
}

