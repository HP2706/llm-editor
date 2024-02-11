from typing import Union, Optional, Type, Iterable, AsyncGenerator
from .dataModels import Metadata, Document # type: ignore
from fastapi import UploadFile
import docx2txt
import re
from .utils import count_tokens
from io import BytesIO

async def Process_file(file: UploadFile) -> Union[Type[Document], str]:
    '''This function takes a document and returns a list of proposed edits'''

    if file.filename.endswith('docx'): # type: ignore
        try:
            # Read the content of the file into a bytes-like object

            content_bytes = await file.read()
            # Convert the bytes-like object to a BytesIO object
            file_like_object = BytesIO(content_bytes)
            # Process the file using docx2txt
            doc = docx2txt.process(file_like_object)
            # Use a list comprehension to extract text from each paragraph in the document
            n_tokens = count_tokens(doc)
            n_words = len(doc.split())
            metadata = Metadata(title=file.filename, n_tokens=n_tokens, n_words=n_words)
            return Document(text=doc, metadata=metadata)
        except Exception as e:
            return f"Error processing the file '{file.filename}': {e}"
    elif file.filename.endswith('md') or file.filename.endswith('txt'): # type: ignore
        try:
            content_bytes = await file.read()
            content = content_bytes.decode('utf-8')
            content = ' '.join(content.splitlines())
            pattern = r'\[\[(.*?)\]\]'
            content = re.sub(pattern, r'\1', content)
            n_tokens = count_tokens(content)
            n_words = len(content.split())
            metadata = Metadata(title=file.filename, n_tokens=n_tokens, n_words=n_words)
            return Document(text=content, metadata=metadata)
        except Exception as e:
            return f"Error processing the file '{file.filename}': {e}"
    else:
        return f"Unsupported file format: '{file.filename}'"