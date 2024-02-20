import { LexicalEditor } from "lexical";
import { useEffect } from "react";

export const ColorButton =  (editor : LexicalEditor) => {
  useEffect(() => {
    // todo, when state changes, traverse and find all changed words, then call the backend to get color, use batching
  }, [editor._editorState]);


  return (
      <div>
          <button
          onClick={() => {
              // todo
          }}
          className={"toolbar-item spaced active"}
          aria-label="Format Strikethrough"
          >
            <i className="format color-ai" />
        </button>
      </div>    
  )
}
