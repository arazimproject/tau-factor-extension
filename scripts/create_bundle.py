import os

if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))
    if os.path.exists("extension.zip"):
        os.remove("extension.zip")
    os.system("zip -r extension.zip dist README.md manifest.json README.md")
