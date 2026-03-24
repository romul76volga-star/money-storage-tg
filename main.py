from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI()

# Подключаем папку с картинками и стилями
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

@app.get("/")
async def read_index():
    # Отправляем главный файл интерфейса
    return FileResponse('index.html')

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
