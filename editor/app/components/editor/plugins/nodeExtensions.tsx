import '@/app/styles/MarkdownEditorNode.css';
import '@/app/styles/globals.css';

import { $createTextNode, $getRoot, DecoratorNode, LexicalEditor, SerializedTextNode } from "lexical";
import { Edit, LogProb } from "@/lib/types";

import { ReactNode } from 'react';
import { TextNode } from "lexical";
import { applyEdit } from "./AiEditPlugin";
import { collectAllNodes } from "../editorUtils";
import { useState } from "react";

interface SerializedButtonTextNode extends SerializedTextNode {
    type: 'editabletext';
    text: string;
    edit: Edit;
    editor : LexicalEditor;
  }
  
export class ButtonTextNode extends TextNode {
    private edit: Edit;
    public proposed_edit : string;
    private editor : LexicalEditor;


    static getType(): string {
        return 'buttonTextNode';
    }

    static clone(node: ButtonTextNode): ButtonTextNode {
        return new ButtonTextNode(node.edit, node.editor);
    }

    constructor(edit : Edit, editor : LexicalEditor) {
        try {
            super(edit.quote);
            this.__text = edit.quote;
            this.proposed_edit = edit.proposed_edit;
            this.edit = edit;
            this.editor = editor;
        } catch (e) {
            console.log("error", e);
            console.log("could not instantiate textNode from edit.quote:", edit.quote);
            throw new Error("could not instantiate textNode from edit.quote:" + edit.quote);
        }
    }

    static importJSON(serializedNode: SerializedButtonTextNode): ButtonTextNode {
        const { text, edit, editor } = serializedNode;
        const node = new ButtonTextNode(edit, editor);
        return node;
    }
    // Implement the exportJSON method
    exportJSON(): SerializedButtonTextNode {
        return {
        ...super.exportJSON(), // Spread the base properties
        type: 'editabletext',
        text: this.__text,
        edit: this.edit,
        editor : this.editor
        };
    }

    createDOM(config: unknown): HTMLElement {
        // Create the text content
        const textContent = document.createElement('span');
        textContent.textContent = this.edit.quote; // Display the current text
        textContent.style.color = 'red';
        textContent.className = 'editable-text-node'; // Add class for styling

        // Create the edit button
        const button = document.createElement('button');
        button.textContent = this.edit.proposed_edit; // Set button label
        button.className = 'edit-button'; // Add class for styling
        button.style.display = 'inline'; // Hide the button initially
        button.onclick = () => {
            applyEdit(this.editor, this);
        };

        const rejectButton = document.createElement('button');
        rejectButton.textContent = "Reject"; // Set button label
        rejectButton.className = 'edit-button'; // Add class for styling
        rejectButton.style.display = 'inline'; // Hide the button initially
        rejectButton.onclick = () => {
        this.editor.update(() => {
            this.replace($createTextNode(this.edit.quote));
        });
        };

        // Append the button to the textContent span
        textContent.appendChild(button);
        textContent.appendChild(rejectButton);

        // Show the button on hover of the textContent
        textContent.onmouseover = () => {
        button.style.display = 'inline'; // Show the button
        };
        textContent.onmouseout = () => {
        button.style.display = 'none'; // Hide the button
        };

        return textContent;
    }
} 
