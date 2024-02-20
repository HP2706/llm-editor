from modalBackend import Model
from common import stub
from editor.pages.api.dataModels import Document, Metadata

@stub.local_entrypoint()
def main():
    model = Model()
    string = "This is a test string"
    for item in model.generate.remote_gen(string, 2):
        print(item)

