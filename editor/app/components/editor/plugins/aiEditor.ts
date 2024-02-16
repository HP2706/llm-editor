// this plugin should capture all the text send it to backend, and get streamed edits back 
// and apply highlighting with button to accept or reject the changes

import { captureText, matchString } from "../editorUtils";

import { LexicalEditor } from "lexical";
import { registerCodeHighlighting } from "@lexical/code";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function SteamAiEdits(editor : LexicalEditor) {
    captureText(editor).then( async (mytext :string) => {
      // Correct the condition to check if the text is actually empty
      if (mytext === ""){
        console.log("mytext captured was empty");
        return;
      }
      console.log("mytext captured", mytext);

      const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
      const endpoint = `${host}/api/editDoc`;
      console.log(endpoint);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json', // Specify the content type as JSON
        },
        body: JSON.stringify({
            text : mytext,
            useAsync : false
        }),
      });

      console.log(response);

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        reader.read().then(function processText({ done, value }) {
          if (done) {
            console.log("Stream complete");
            return;
          }
          // Process the chunk
          const chunk = decoder.decode(value, { stream: true });
          console.log("Received chunk", chunk);
          // Here you can parse the JSON line and apply the edits
          // For example:
          const edits = chunk.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
          edits.forEach(edit => {
            console.log("edit", edit);
            // applyEditToEditor(edit);
          });
          // applyEditToEditor(edit);

          // Read the next chunk
          reader.read().then(processText);
        });
      }
    });
  return null;    
} 