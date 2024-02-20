from .dataModels import Metadata, Document # type: ignore
import tiktoken
from typing import List, Union

def count_tokens(text: str) -> int:
       # Tokenize and count tokens with tiktoken
    tokenizer = tiktoken.get_encoding(
        "cl100k_base"
        )
    n_tokens = len(tokenizer.encode(text, disallowed_special=()))
    return n_tokens

def split_doc(n_tokens: int, document: Document) -> Union[List[Document], Document]:
    '''this function splits the document into parts of n_tokens or smaller'''
    if not document.metadata:
        n_tokens = count_tokens(document.text)
        

    if n_tokens >= document.metadata.n_tokens:
        return [document]
    else:
        split_docs = []
        sentences = document.text.split('.')
        current_text = ""
        current_tokens = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:  # Skip empty sentences
                continue
            sentence += '.'  # Add the period back for natural reading
            tokens_in_sentence = count_tokens(sentence)
            if current_tokens + tokens_in_sentence > n_tokens:
                # If adding this sentence exceeds the limit, store the current text as a document
                split_docs.append(
                    Document(
                        text=current_text, metadata=Metadata(n_tokens=current_tokens, n_words=len(current_text.split()))
                    )
                )
                current_text = sentence  # Start a new document with the current sentence
                current_tokens = tokens_in_sentence  # Reset token count
            else:
                current_text += " " + sentence if current_text else sentence
                current_tokens += tokens_in_sentence

        # Add the last part if there's any
        if current_text:
            split_docs.append(
                Document(
                    text=current_text, metadata=Metadata(n_tokens=current_tokens, n_words=len(current_text.split()))
                )
            )

        return split_docs
    
def build_doc_from_string(text: str) -> Document:
    '''this function builds a document object from a string'''
    return Document(text=text, metadata=Metadata(title = None,n_tokens=count_tokens(text), n_words=len(text.split())))