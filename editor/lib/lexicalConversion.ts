import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import { $getRoot, LexicalEditor, LexicalNode } from 'lexical';
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'

import { asBlob } from 'html-docx-js-typescript'
import {marked} from 'marked';
import {renderAsync} from 'docx-preview';

//this page provides functions that convert 
//.docx -> html -> lexical
//lexical -> html -> .docx
//markdown/txt -> html -> lexical
//lexical -> html -> markdown/txt

//.docx -> html
export async function docx_to_html(file: File): Promise<string> {
  const fileData = await file.arrayBuffer();
  const container = document.createElement("div"); // Create a temporary container for rendering

  await renderAsync(fileData, container, container);
  return container.innerHTML; // Return the rendered HTML as a string
}

//html -> .docx
export async function html_to_docx(htmlString: string): Promise<Blob> {
    const opt = {
      margin: {
        top: 100
      },
      orientation: 'landscape' as const
    };
    const fileBuffer = await asBlob(htmlString, opt)
    const blob = new Blob(
      //seems risky
      [fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    );
    return blob;
}

//markdown/txt -> html
export async function markdown_to_html(file: File): Promise<string> {
  const markdownText = await file.text();
  return await marked.parse(markdownText);
}

//html -> markdown/txt
export async function html_to_markdown(htmlString: string): Promise<Blob> {
  const markdown = NodeHtmlMarkdown.translate(htmlString);
  const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
  return markdownBlob;
}


//html -> lexical
export function html_to_lexical(htmlString: string, editor: LexicalEditor): void {
  const parser = new DOMParser();
  editor.update(() => {
    const dom = parser.parseFromString(htmlString, 'text/html');
    const nodes = $generateNodesFromDOM(editor, dom);
    $getRoot().clear().append(...nodes);
  });
  
}

//lexical -> html
export const lexical_to_html = async (editor: LexicalEditor): Promise<string> => {
  return new Promise<string>((resolve) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor, null); // Adjusted to pass rootNode instead of editor.
      resolve(htmlString); // Resolve the promise with the htmlString
    });
  });
};