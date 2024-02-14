import '@/app/ccomponents/styles/fileDisplay.css';

interface FileDisplayProps {
    title : string;
    Icon:  React.ElementType;
}

export const FileDisplay = (props : FileDisplayProps) => {
    const {title, Icon} = props;
    return (
        <div>
            <Icon />
            <h3>{title}</h3>
        </div>
    )
}