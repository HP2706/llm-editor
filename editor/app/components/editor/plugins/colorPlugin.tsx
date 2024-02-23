import '@/app/styles/MarkDownEditorNode.css';

import { $getRoot, LexicalEditor, TextNode } from "lexical";
import { LogProbRequest, LogProbs, LogProbsResponse } from "@/lib/types";
import { RGBA_TO_STRING, captureText, collectAllNodes } from '@/app/components/editor/editorUtils';
import { useEffect, useState } from "react";

import { ButtonTextNode } from "@/app/components/editor/plugins/AiEditPlugin";
import { HoverButton } from '@/app/components/ui/buttons';

export const ColorButton =  ({editor} : {editor : LexicalEditor}) => {
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

  const applyLogProbs = async (editor : LexicalEditor, logprobs : LogProbsResponse, initialOffset : number) : Promise<void> => {
    let allText = await captureText(editor);  
    let text = allText.slice(initialOffset, allText.length); // we want to begin at offset and disregard the rest
    
    let currentOffset = initialOffset;
    editor.update(() => {
      const allNodes = collectAllNodes($getRoot());
      logprobs.data.forEach((logprob: LogProbs) => {
        // Find the first instance of the token after the current offset
        const tokenIndex = text.indexOf(logprob.token);
        if (tokenIndex !== -1) {
          let cumulativeLength = 0;
          for (const node of allNodes) {
            if (node instanceof TextNode) {
              const nodeText = node.__text;
              const nodeLength = nodeText.length;
              // Check if the token is within this node based on the cumulative length
              if (cumulativeLength + nodeLength >= tokenIndex + currentOffset) {
                // Calculate the relative index of the token within this node
                const relativeIndex = tokenIndex + currentOffset - cumulativeLength;
                // Split and style the node
                const [leftNode, restNode] = node.splitText(relativeIndex);
                const [midNode, rightNode] = restNode.splitText(logprob.token.length);
                midNode.setStyle(`color: ${RGBA_TO_STRING(logprob.color)}`);
                break; // Stop after styling the first occurrence
              }
              cumulativeLength += nodeLength;
            }
          }
          // Update the offset to search for the next token after the current one
          currentOffset += tokenIndex + logprob.token.length;
          // Adjust the text to start from the new offset
          text = text.slice(tokenIndex + logprob.token.length);
        }
      });
    });
  }

  async function callAi() {
    const allText = await captureText(editor);
    const probs = await getLogProbs(allText);
    console.log("probs", probs);
    applyLogProbs(editor, probs, 1);
  }

  //todo make this be streamed
  const getLogProbs = async (prompt : string) : Promise<LogProbsResponse> =>{
    const request : LogProbRequest = {
      prompt : prompt,
      idx : 1
    }

    const host = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL; // modify later
    const endpoint = `${host}/api/DummyGetLogProbs`; // change later, this is for faster and cheaper dev
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      .then(response => {console.log("recieved response", response); return response.json()})
    console.log("logrpobs response", response);
    return response;
  } 

  return ( 
    <HoverButton text="Color the text" >
      <button
        onClick={() => {
            ToggleAi();
            callAi();
        }}
        className={"toolbar-item spaced"}
        aria-label="Format Strikethrough"
        >
          <i className="format ai-color" />
      </button>
    </HoverButton>
  )
}
