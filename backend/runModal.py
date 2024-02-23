from src.modalBackend import Model
from src.common import stub

@stub.local_entrypoint()
def main():
    model = Model()
    import json
    text = """In a quaint littel town, there was a man named Tom. Tom was a gardner, spending his days tending to his flowrs and vegetabels. He took pride in his work, although he was not the best speller. One day, he decided to enter his best producs into the local fare.
He carefully selected his finest carots, lettuces, and tomatos, placing them into baskets. With everything ready, he set of to the fare, excited but nervus. At the fare, people gathered around his stall, admiring his hard work. However, they quickly noticed the signs:
"Fresh Carots for Sale!"
"Beutiful Lettuces - Best in Show!"
"Juicy Tomatos - Get Them While They Last!"
The crowd began to chuckel at the misspellings, but soon their attention turned to the quality of Tom's produce. Despite the misstakes on his signs, everyone was impressed by the freshness and taste of his vegetables and flowers.
By the end of the day, Tom had sold out of all his produce, proving that actions (and quality) speak louder than words - or, in this case, spelling errors. He went home, tired but happy, knowing that sometimes, it's not about the perfection in details but the passion and effort you put into your work."""
    model = Model()
    logprobs_list = []
    for logprobs in model.generate.remote_gen(
            text, 
            1
        ):
        logprobs_list.extend(logprobs)
    
    import os
    print("dir before", os.listdir())
    with open("logProbs.json", "w") as f:
        f.write(json.dumps({'text' : text ,'logprobs' : [logprob.model_dump() for logprob in logprobs_list]}))
    print("json dumped")
    print("dir after", os.listdir())


