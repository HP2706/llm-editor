import { $generateHtmlFromNodes } from '@lexical/html';
import {$generateNodesFromDOM} from '@lexical/html';
import { LexicalEditor } from 'lexical';
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
export async function html_to_docx(htmlString: string): Promise<any> {
    const opt = {
      margin: {
        top: 100
      },
      orientation: 'landscape' as const
    };
    const fileBuffer = await asBlob(htmlString, opt)

    return fileBuffer;
}

//markdown/txt -> html
export async function markdown_to_html(file: File): Promise<string> {
  const markdownText = await file.text();
  return await marked.parse(markdownText);
}

//html -> markdown/txt
export async function html_to_markdown(htmlString: string): Promise<Blob> {
  const markdown = await marked.parse(htmlString, { renderer: new marked.Renderer() });
  const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
  return markdownBlob;
}


//html -> lexical
export function html_to_lexical(htmlString: string, editor: any): any {
  const parser = new DOMParser();
  const dom = parser.parseFromString(htmlString, 'text/html');
  const nodes = $generateNodesFromDOM(editor, dom);
  return nodes;
}

//lexical -> html
export const lexical_to_html = (editor: LexicalEditor) => {
  editor.update(() => {
    const htmlString = $generateHtmlFromNodes(editor, null);
    console.log('htmlString', htmlString);
  });
};