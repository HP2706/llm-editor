import React, { useEffect, useState } from "react";
import { SteamAiEdits, applyAllEdits } from '@/app/components/editor/plugins/AiEditPlugin';

import { GridiconsCloudDownload } from '@/app/components/ui/icons';
import { HoverButton } from '@/app/components/ui/buttons';
import { LexicalEditor } from "lexical";
import { TextNode } from "lexical";
import { checkContainsButtonNode } from "../editorUtils";
import { export_file_from_LexicalState } from '@/app/components/editor/editorUtils';

export const AiEditButton =  ({editor} : {editor : LexicalEditor}) => {
    const [activeEdits, setActiveEdits] = useState(false);
    
    useEffect(() => {
      setActiveEdits(checkContainsButtonNode(editor)); // this checks if any TextButtonNodes are present
      console.log("activeEdits", activeEdits);
    }, [editor._editorState, editor]);
  
    return (
      <HoverButton text="Let AI Edit" >
          <button
            onClick={() => {
                SteamAiEdits(editor);
            }}
            className={"toolbar-item spaced"}
            aria-label="Format Strikethrough"
          >
            <i className="format ai-magic" /> {/* TODO new icon*/}
          </button>
      </HoverButton>
    )
}
  
export const ApplyAllEditsButton =  ({editor} : {editor : LexicalEditor}) => {
const [activeEdits, setActiveEdits] = useState(false);
useEffect(() => {
    setActiveEdits(checkContainsButtonNode(editor)); // this checks if any TextButtonNodes are present
    console.log("activeEdits", activeEdits);
}, [editor._editorState, editor]);

return (
    <button
        onClick={() => {
            applyAllEdits(editor);
        }}
        className={"toolbar-item spaced text"}
        aria-label="Format Strikethrough"
        >
        Apply all edits
    </button>
    )  
}



export const DownloadButton = ({editor, filename} : {editor : LexicalEditor, filename : string}) => {
    return (
        <HoverButton text="download">
            <button 
                onClick={() => {
                    console.log("typeof lexicaleditor", typeof editor);
                    export_file_from_LexicalState(editor, filename);
                }}
                className={"toolbar-item spaced" + (filename ? "active" : "")}
                aria-label="Format Strikethrough"
                >
                <i className="format download" />
            </button>
        </HoverButton>
    )
}
