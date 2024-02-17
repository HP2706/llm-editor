import '@/app/styles/fileDisplay.css';

import { MarkDownIcon, NightIcon, WordIcon } from '@/app/components/ui/icons';

import { BasicButton } from '@/app/components/ui/buttons';

interface FileDisplayProps {
    title : string;
    Icon:  React.ElementType | JSX.Element | any; //fix typing here
    onClick: () => void;
}

const FileDisplay = (props : FileDisplayProps) => {
    const {title, Icon, onClick} = props;


    function dummyFunc() {
        console.log('FileDisplay dummy func');
    }
    
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
}

export const MultiFileDisplay = (props : MultiFileDisplayProps) => {
    const {selectedFiles} = props;

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
                return <FileDisplay onClick={internalfunc} 
                    key={index} title={file.name.split('.').slice(0, -1).join('.')} 
                    Icon={icon}>
                </FileDisplay>;
            })}
        </div>
    )
}