import '@/app/styles/globals.css';
import '@/app/styles/markdDownEditor.css';

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { $getRoot, LexicalEditor, createEditor } from 'lexical';
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { Dispatch, SetStateAction } from "react";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import React, { useEffect, useRef, useState } from 'react';
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {docx_to_html, html_to_docx, html_to_lexical, html_to_markdown, lexical_to_html} from '@/lib/lexicalConversion';

import ActionsPlugin from "./plugins/ActionsPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { exampleTheme } from "@/app/components/editor/themes/theme";
import prepopulatedText  from "./sampletext";
import { saveAs } from 'file-saver';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  const resetError = () => setHasError(false);

  useEffect(() => {
    return () => resetError();
  }, [children]);

  if (hasError) {
    return <div>Something went wrong</div>;
  }

  return (
    <React.Fragment>
      {React.Children.map(children, child =>
        React.cloneElement(child as React.ReactElement<any>, { onError: setHasError })
      )}
    </React.Fragment>
  );
}


function Placeholder() {
  return (
    <div className="editor-placeholder">
      Play around with the Markdown plugin...
    </div>
  );
}

interface FileExtension {
  name : 'docx' | 'md' | 'txt';
}

async function export_file_from_LexicalState(editor: LexicalEditor, filename : string) {
    if (filename.endsWith('docx')) {
      //convert to html, then convert to docx
      const htmlstring = lexical_to_html(editor);
      const blob = await html_to_docx(htmlstring);
      saveAs(blob, filename);
    } else if (filename.endsWith('md') || filename.endsWith('txt')) {
      //convert to markdown
      const htmlstring = lexical_to_html(editor);
      const markdown_blob = await html_to_markdown(htmlstring);
      saveAs(markdown_blob, filename);
    }

}

function EditorContent({ fileState }: { fileState: File }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
      const loadInitialContent = async () => {
        if (fileState.name.endsWith('.docx')) {
          //directly update the editor state
          const htmlFileState = await docx_to_html(fileState);
          console.log("htmlFileState", htmlFileState)
          await html_to_lexical(htmlFileState, editor); // editor update happens internally
          
          export_file_from_LexicalState(editor, fileState.name);
          
        } else if (fileState.name.endsWith('.md') || fileState.name.endsWith('.txt')) {
          // get the markdown string
          console.log("fileState", fileState)
          const markdown = await fileState.text();
          editor.update( () => {
            console.log("markdown", markdown)
            $convertFromMarkdownString(markdown, TRANSFORMERS)
          });
          //for testing ONLY
          export_file_from_LexicalState(editor, fileState.name);
        }
    }
    loadInitialContent();
  }, [fileState, editor]);

  return (
    <div className="editor-inner">
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={<Placeholder />}
        ErrorBoundary={ErrorBoundary}
      />
      <AutoFocusPlugin />
      <ListPlugin />
      <LinkPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <CodeHighlightPlugin />
    </div>
  );
}

interface MarkdownEditorProps {
  fileState : File; 
}


const MarkdownEditor = (props: MarkdownEditorProps) => {
  const { fileState } = props;

  const editorConfig = {
    namespace: 'MyUniqueEditorNamespace',
    //editor: prepopulatedText(),
    theme: exampleTheme,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode
    ],
    onError(error: any) {
      throw error;
    },
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
          <EditorContent fileState={fileState} />
        <ActionsPlugin />
      </div>
    </LexicalComposer>
  );
}

export { MarkdownEditor };