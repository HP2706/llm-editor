import '@/app/styles/FileDisplay.css';

import { MarkDownIcon, NightIcon, WordIcon } from '@/app/components/ui/icons';

import { BasicButton } from '@/app/components/ui/buttons';

interface FileDisplayProps {
    title : string;
    Icon:  React.ElementType | JSX.Element | any; //fix typing here
    onClick: () => void;
}

const FileDisplay = (props : FileDisplayProps) => {
    const {title, Icon, onClick} = props;

    return (
        <div className='file-display-box' onClick={onClick}>
            <Icon className="icon"/>
            <div className="custom-title-gradient">
                {title}
            </div>
        </div>
    )
}

interface MultiFileDisplayProps {
    selectedFiles : File[];
    setFileIdx : (idx : number | null) => void;
}

export const MultiFileDisplay = (props : MultiFileDisplayProps) => {
    const {selectedFiles, setFileIdx} = props;



    const internalfunc = () => {
        console.log('internalfunc');
    }

    return (
        <div className='file-container-div justify-end' onClick={internalfunc}>
            {selectedFiles.length > 0 &&
            selectedFiles.map((file, index) => {
                let icon = null;
                if (file.name.endsWith('docx')) {
                    icon = WordIcon;
                } else {
                    icon = MarkDownIcon;
                }
                return <FileDisplay onClick={() => setFileIdx(index)} 
                    key={index} title={file.name.split('.').slice(0, -1).join('.')} 
                    Icon={icon}>
                </FileDisplay>;
            })}
        </div>
    )
}