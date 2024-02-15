import '@/app/styles/globals.css';
import '@/app/styles/markdDownEditor.css';

import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { Dispatch, SetStateAction } from "react";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LexicalEditor, createEditor } from 'lexical';
import { ListItemNode, ListNode } from "@lexical/list";
import React, { useEffect, useRef, useState } from 'react';
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

import ActionsPlugin from "./plugins/ActionsPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { exampleTheme } from "@/app/components/editor/themes/theme";
import {html_to_lexical} from '@/lib/lexicalConversion';
import prepopulatedText  from "./sampletext";

//import { useLexicalComposerContext } from '@lexical/react'; // CANNOT GET THIS TO WORK ARGHH



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

interface MarkdownEditorProps {
  htmlFileState : string; // this should be
  setHtmlFileState: Dispatch<SetStateAction<string[]>>;
}

const MarkdownEditor = (props : MarkdownEditorProps) => {
  const {htmlFileState, setHtmlFileState} = props;
  //const [editor] = useLexicalComposerContext(); // Get the Lexical editor instance
  const editorContainerRef = useRef<HTMLDivElement>(null);
  let editor: LexicalEditor | null | any = null;

  useEffect(() => {
    if (editorContainerRef.current) {
      editor = createEditor({
        // Editor configuration
        namespace: 'MyUniqueEditorNamespace',
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
      });

      // Convert your HTML to Lexical state and set it
      const initialState = html_to_lexical(htmlFileState, editor);
      editor.setEditorState(initialState);

      // Cleanup on component unmount
      return () => {
        editor?.destroy();
      };
    }
  }, [htmlFileState]);

  
  const editorConfig = {
    namespace: 'MyUniqueEditorNamespace',
    editorState: html_to_lexical(htmlFileState, editor),
    theme: exampleTheme,

    // Handling of errors during update
    onError(error : any) {
      throw error;
    },
    // Any custom nodes go here
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
    ]
  };
  
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
            ErrorBoundary={ErrorBoundary} // Add this line
          />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <CodeHighlightPlugin />
        </div>
        <ActionsPlugin />
      </div>
    </LexicalComposer>
  );
}

export { MarkdownEditor };