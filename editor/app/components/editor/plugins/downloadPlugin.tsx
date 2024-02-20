import { GridiconsCloudDownload } from '@/app/components/ui/icons';
import { LexicalEditor } from "lexical";
import { SteamAiEdits } from '@/app/components/editor/plugins/AiEditPlugin';
import { export_file_from_LexicalState } from '@/app/components/editor/editorUtils';
export const DownloadButton = ({editor, filename} : {editor : LexicalEditor, filename : string}) => {
    return (
        <div>
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
        </div>
    )
}
