from multiprocessing import cpu_count
from .dataModels import LogProb, Document
from typing import List, Union
from transformers import AutoTokenizer
import matplotlib.pyplot as plt
import asyncio

def getDifference(text : str, text2 : str) -> str:
    '''gets the difference between two texts'''
    # get the difference
    return ''.join([char2 for char1, char2 in zip(text, text2) if char1 != char2])

class Model:
    _instance = None

    @classmethod
    def getInstance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        '''gets the logprobs from together ai model'''
        model_name ="mistralai/Mistral-7B-Instruct-v0.1"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.cmap = plt.get_cmap('viridis')
        self.max_batch_size = 100
    
    def chunk_and_split(self, document: Document) -> List[Union[List[str], List[List[str]]]]:
        '''splits the text into i, i+1, i+2, ... i+n chunks and then separates into batches of max_batch_size
        #TODO this will get extremely inefficient for larger docs, try to do this more efficiently
        '''
        max_batch_size = self.max_batch_size
        text = document.text
        tokens = self.tokenizer.tokenize(text)
        n = len(tokens)
        next_tokens = [tokens[i] for i in range(1, n)]  # Start from the second token
        tokens_ids = self.tokenizer.convert_tokens_to_ids(tokens)
        chunks = [tokens_ids[:i+1] for i in range(0, n-1)]  
        print("chunks", len(chunks))
        print("next_tokens", len(next_tokens))

        batched_token_chunks = [[self.tokenizer.decode(chunk) for chunk in chunks[i:i+max_batch_size]] for i in range(0, n, max_batch_size)]
        batched_next_tokens = [next_tokens[i:i+max_batch_size] for i in range(0, n-1, max_batch_size)]  # n-1 because next_tokens is one less than tokens_ids
        return batched_token_chunks, batched_next_tokens

    
    async def compute_logprobs(self, text : str) -> LogProb:
        '''call modal app to get the logprobs'''
        #TODO call modal api....
    
    async def gather_logprobs(self, tokens : List[str]) -> List[LogProb]:
        '''gets the logprobs for each word that is converted to a token in the list
        #TODO this is not fully tested yet
        '''
        logprobs = []
        input = []
        for token in tokens:
            input.append(token)
            logprob = self.compute_logprobs(input) 
            logprob = self.getColor(logprob)
            logprobs.append(logprob)
        logprobs = await asyncio.gather(*logprobs) 
        #now get colors
        return logprobs

    def getColor(self, logprobs: LogProb) -> LogProb:
        '''returns the text with the logprobs colored'''
        color = self.cmap(logprobs.logprob)
        return LogProb(token=logprobs.token, logprob=logprobs.logprob, color=color)
    
    async def getLogProbs(self, document : Document, n_cores : int = cpu_count()) -> List[LogProb]:
        '''gets the logprobs for the document'''
        chunks = self.chunk_text(document, n_cores)
        logprobs = await self.gather_logprobs(chunks)
        logprobs = self.getColorFromProbs(logprobs)
        return logprobs
