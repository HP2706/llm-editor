import '@/app/styles/globals.css';
import '@/app/styles/markdDownEditor.css';

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { Dispatch, SetStateAction } from "react";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import React, { useEffect, useRef, useState } from 'react';
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { docx_to_html, html_to_lexical } from '@/lib/lexicalConversion';

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ButtonTextNode } from '@/app/components/editor/plugins/nodeExtensions';
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { SteamAiEdits } from '@/app/components/editor/plugins/AiEditPlugin';
import { TextNode } from 'lexical';
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { captureText } from './editorUtils';
import { exampleTheme } from "@/app/components/editor/themes/theme";
import prepopulatedText  from "./sampletext";
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

const editorConfig = {
  namespace: 'MyUniqueEditorNamespace',
  editable: true,
  theme: exampleTheme,
  // Handling of errors during update
  onError(error : any) {
    throw error;
  },
  nodes: [
    ButtonTextNode,
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
};

function EditorContent({ fileState }: { fileState: File }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => { // this does not work for editing the file
      const loadInitialContent = async () => {
        if (fileState.name.endsWith('.docx')) {
          //directly update the editor state
          const htmlFileState = await docx_to_html(fileState);
          await html_to_lexical(htmlFileState, editor); // editor update happens internally
          
        } else if (fileState.name.endsWith('.md') || fileState.name.endsWith('.txt')) {
          // get the markdown string
          console.log("fileState", fileState)
          const markdown = await fileState.text();
          editor.update( () => {
            $convertFromMarkdownString(markdown, TRANSFORMERS)
          });
          //for testing ONLY
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
      <HistoryPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <CodeHighlightPlugin />
    </div>
  );
}

interface MarkdownEditorProps {
  fileState : File; 
}

export const MarkdownEditor = (props: MarkdownEditorProps) => {
  const { fileState } = props;

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin filename={fileState.name} />
          <EditorContent fileState={fileState} />
      </div>
    </LexicalComposer>
  );
};