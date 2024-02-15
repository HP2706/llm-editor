import '@/app/styles/fileDisplay.css';

import { MarkDownIcon, NightIcon, WordIcon } from '@/app/components/ui/icons';

import { BasicButton } from '@/app/components/ui/buttons';

interface FileDisplayProps {
    title : string;
    Icon:  React.ElementType | JSX.Element | any; //fix typing here
    func : () => void; // 
    //size : number;
}

const FileDisplay = (props : FileDisplayProps) => {
    const {title, Icon, func} = props;
    return (
        <div className='file-display-box'>
            <button onClick={() => { console.log('Button clicked'); func(); }}>
                <Icon className="icon"/>
                <div className="custom-title-gradient">
                    {title}
                </div>
            </button>
            
        </div>
    )
}

interface MultiFileDisplayProps {
    selectedFiles : File[];
    upperRight : number[];
    lowerLeft : number[];
    func : (inp:number) => void;
}

export const MultiFileDisplay = (props : MultiFileDisplayProps) => {
    const {selectedFiles, upperRight, lowerLeft, func} = props;

    const style = {
        position: 'absolute' as 'absolute',
        top: `${lowerLeft[1]}px`, // Assuming the Y coordinate is vertical position from top
        left: `${lowerLeft[0]}px`, // Assuming the X coordinate is horizontal position from left
        width: `${upperRight[0] - lowerLeft[0]}px`, // Width based on the difference between right and left X coordinates
        height: `${upperRight[1] - lowerLeft[1]}px`, // Height based on the difference between upper and lower Y coordinates
    };

    return (
        <div style={style} className='file-container-div'>
            {selectedFiles.length > 0 &&
            selectedFiles.map((file, index) => {
                let icon = null;
                if (file.name.endsWith('docx')) {
                    icon = WordIcon;
                } else  {
                    icon = MarkDownIcon;
                }
                return <FileDisplay func={() => func(index)} key={index} title={file.name.split('.').slice(0, -1).join('.')} Icon={icon}></FileDisplay>;
            })}
        </div>
    )
}