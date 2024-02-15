'client';

//this should be removed when done
import React, { useState } from 'react';
import {
    docx_to_html,
    html_to_docx,
    html_to_markdown,
    markdown_to_html
} from '@/lib/lexicalConversion';

import { saveAs } from 'file-saver';

export default function testHTMLCONVERSION() {
    const [htmlContent, setHtmlContent] = useState('');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }

        try {
            if (file.name.endsWith('docx')) {
                const html = await docx_to_html(file, );
                setHtmlContent(html);
                //converting back to docx
                const docxBlob = await html_to_docx(html);
                saveAs(docxBlob, 'converted.docx');

            } else if (file.name.endsWith('md') || file.name.endsWith('txt')) {
                const html = await markdown_to_html(file);
                setHtmlContent(html);
                //converting back to markdown
                const markdownBlob = await html_to_markdown(html);
                saveAs(markdownBlob, 'converted.md');
            }
            
        } catch (error) {
            console.error('Error converting file', error);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
    );
};