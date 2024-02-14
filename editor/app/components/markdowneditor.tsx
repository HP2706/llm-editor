import { css } from '@emotion/react';
import dynamic from 'next/dynamic';
const ReactMarkdown = dynamic(() => import('react-markdown'));

// importantly buttons and stuff should be annotated on top of the writing area, above specific texts

interface MarkdownEditorProps {
    markdown: string;
    setMarkdown: (markdown: string) => void;
}

const MarkdownEditor = (props : MarkdownEditorProps) => {
  const {markdown, setMarkdown} = props;
  return (
    <div css={styles}>
    <textarea
      value={markdown}
      onChange={(e) => setMarkdown(e.target.value)}
    />
    <ReactMarkdown>{markdown}</ReactMarkdown>
  </div>
  );
};

const styles = css`
  display: flex;
  justify-content: space-between;
  .markdown-editor {
    width:  50%;
    padding:  1rem;
  }
  .preview {
    width:  50%;
    padding:  1rem;
    border:  1px solid #ccc;
    border-radius:  5px;
    background-color: #f7f7f7;
    overflow-y: auto;
    max-height:  400px;
  }
`;

export { MarkdownEditor };
