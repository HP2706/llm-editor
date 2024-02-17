import '@/app/styles/markdDownEditor.css';

import { $createParagraphNode, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, LexicalEditor, TextNode } from 'lexical';
import { html_to_docx, html_to_markdown, lexical_to_html } from '@/lib/lexicalConversion';

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
/* 
function Download({editor, filename}) {
  editor.update(() => {
      export_file_from_LexicalState(editor, filename); // Toggle bold on the current selection
  });
}; */

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

//this function goes through the textnodes and checks if a substring is present then returns
// the node that contains the substring
export function matchString(editor: LexicalEditor, mystring: string): Promise<TextNode[]>  {
  return new Promise((resolve) => {
    editor.getEditorState().read( async () => {
      let matchingNodes : TextNode[] = [];
      await editor.getEditorState().read(async () => {
        const root = $getRoot();
        const allTextNodes = root.getAllTextNodes();
        for (const node of allTextNodes) {
          if (node.isSimpleText()) {
            let text = node.getTextContent();
            if (text.includes(mystring)) {
              matchingNodes.push(node);
            }
          }
        }
      });
      await resolve(matchingNodes);
      if (matchingNodes.length > 0) {
        return matchingNodes;
      } else {
        return []
      }
    });
  });
}
