from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn

# --- Data Model ---
class ButtonPress(BaseModel):
    input_type: str
    input_id: int
    value: int

# --- FastAPI Application ---
app = FastAPI()


last_press_state = {"button_id": "None"}

# --- API Endpoints ---

@app.post("/button_press")
async def receive_button_press(press_data: ButtonPress):
    """
    This endpoint receives the button data from the intermediary script.
    """
    print(f"API received: {press_data}")
    # Update the global state with the ID of the button that was pressed.
    last_press_state["button_id"] = press_data.input_id
    return {"status": "ok", "received": press_data}


@app.get("/", response_class=HTMLResponse)
async def show_last_press_page():
    """
    This endpoint generates and returns a simple HTML page
    that displays the last button pressed.
    """
    # Get the last saved button ID.
    button_id = last_press_state["button_id"]
    
    html_content = f"""
    <html>
        <head>
            <title>Arduino Input Monitor</title>
            <meta http-equiv="refresh" content="1">
            <style>
                body {{ 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    display: grid; 
                    place-content: center; 
                    text-align: center; 
                    height: 100vh; 
                    margin: 0; 
                    background-color: #1e1e1e; 
                    color: #d4d4d4; 
                }}
                div {{ 
                    border: 2px solid #007acc; 
                    padding: 2rem 4rem; 
                    border-radius: 12px;
                    background-color: #252526;
                }}
                h1 {{ color: #007acc; }}
                span {{ font-size: 4rem; font-weight: bold; color: #4ec9b0; }}
            </style>
        </head>
        <body>
            <div>
                <h1>Last Button Pressed</h1>
                <span>{button_id}</span>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)