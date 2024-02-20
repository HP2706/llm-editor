import { LexicalEditor, TextNode } from "lexical";
import { LogProbRequest, LogProbs, LogProbsResponse } from "@/lib/types";
import { useEffect, useState } from "react";

import { ButtonTextNode } from "@/app/components/editor/plugins/AiEditPlugin";

export const ColorButton =  (editor : LexicalEditor) => {
  const [isAi, setIsAi] = useState(false);

  //TODO fix this
  /* useEffect(() => {
    const getMutatedWord = editor.registerMutationListener(
      ButtonTextNode || TextNode,
      (mutatedNodes) => {
        mutatedNodes.forEach((mutation, nodeKey) => {
          console.log('Mutation:', mutation);
          console.log('Node key:', nodeKey);
          if (mutation === 'text') { // Check if the mutation type is text
            const node = editor._nodes.get(nodeKey); // Get the node from the editor's internal nodes map
            if (node instanceof TextNode) { // Ensure the node is a TextNode
              const newText = node.getText(); // Get the newly changed text from the node
              console.log('Newly changed paragraph:', newText);
            }
          }
        });
      },
    );
  
    return () => {
      editor.unregisterMutationListener(getMutatedWord); // Unregister the listener when no longer needed
    };
  }, [isAi, editor]); */


  const ToggleAi = () => {
    setIsAi(!isAi);
  }

  const getLogProbs = (prompt : string) => {
    const request : LogProbRequest = {
      prompt : prompt
    }

    const url = "....";
    const endpoint = "/getLogProbs";
    fetch(url + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then((logprobs : LogProbsResponse) => {
      changeColor(logprobs);
    })
  } 

  const changeColor = (logprobs : LogProbsResponse) => {
    console.log(logprobs);
  }

  return (
      <div>
          <button
          onClick={() => {
              ToggleAi();
          }}
          className={"toolbar-item spaced" + (isAi ? "active" : "")}
          aria-label="Format Strikethrough"
          >
            <i className="format color-ai" />
        </button>
      </div>    
  )
}
