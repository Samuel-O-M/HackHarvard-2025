from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn

# --- Modelo de Datos: Define la estructura de los datos que esperamos ---
class SensorData(BaseModel):
    distance1: int
    distance2: int

# --- Aplicación FastAPI ---
app = FastAPI()

# Variable global para guardar el estado más reciente de los sensores
last_sensor_data = {"distance1": "---", "distance2": "---"}

# --- Endpoints de la API ---

@app.post("/update_distances")
async def receive_sensor_data(data: SensorData):
    print(f"API recibió: {data}")
    # Actualiza el estado global con las nuevas distancias.
    last_sensor_data["distance1"] = data.distance1
    last_sensor_data["distance2"] = data.distance2
    return {"status": "ok", "received": data}


@app.get("/", response_class=HTMLResponse)
async def show_distances_page():
    dist1 = last_sensor_data["distance1"]
    dist2 = last_sensor_data["distance2"]
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <title>Monitor de Sensores Arduino</title>
        <meta http-equiv="refresh" content="0.5">
        <style>
            body {{ 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                text-align: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #1e1e1e; 
                color: #d4d4d4;
                gap: 2rem;
            }}
            .sensor-box {{ 
                border: 2px solid #007acc; 
                padding: 2rem 4rem; 
                border-radius: 12px;
                background-color: #252526;
                width: 250px;
            }}
            h1 {{ color: #007acc; margin-top: 0; }}
            span {{ font-size: 4rem; font-weight: bold; color: #4ec9b0; }}
            .unit {{ font-size: 1.5rem; color: #9cdcfe; margin-left: 0.5rem; }}
        </style>
    </head>
    <body>
        <div class="sensor-box">
            <h1>Sensor 1</h1>
            <p>
                <span>{dist1}</span>
                <span class="unit">cm</span>
            </p>
        </div>
        <div class="sensor-box">
            <h1>Sensor 2</h1>
            <p>
                <span>{dist2}</span>
                <span class="unit">cm</span>
            </p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
