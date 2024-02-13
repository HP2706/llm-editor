
from editor.pages.api.dataModels import Document, Metadata
from editor.pages.api.utils import count_tokens
from typing import List, Union
from editor.pages.api.llm import make_edits, async_make_edits, async_process_doc, process_doc
from editor.pages.api.computeLogProbs import Model

text = "helo ow are you doing today? in good tak you"


doc = Document(text=text, metadata=Metadata(title="test", n_tokens=count_tokens(text), n_words=len(text.split())))
import time 

import asyncio

async def process(Doc : Document):
    async for edit in async_make_edits(Doc):
        print("edit", edit)

asyncio.run(process(doc))