import asyncio
from playwright.async_api import async_playwright
from fastapi import FastAPI, WebSocket
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import base64
import uvicorn
import json
from bs4 import BeautifulSoup


app = FastAPI()

# Initialize Playwright and the page outside of the websocket endpoint
p = None
page = None


async def getSimplePage():
    return page


theRedDot = """
document.addEventListener('mousemove', function(event) {

  const oldCursor = document.getElementById('cursor');
    if (oldCursor) {
        oldCursor.remove();
    }
    
  const target = event.target;
  const cursor = window.getComputedStyle(target).cursor;
  const emoji = cursor === 'pointer' ? '👆' : cursor === 'text' ? '✍️' : '↖';
  const cursorElement = document.createElement('div');
  cursorElement.id = 'cursor';
  cursorElement.textContent = emoji;
  cursorElement.style.position = 'fixed';
  cursorElement.style.left = event.clientX + 'px';
  cursorElement.style.top = event.clientY + 'px';
  cursorElement.style.fontSize = '24px';
  cursorElement.style.pointerEvents = 'none';
  cursorElement.style.zIndex = '100000';
  document.body.appendChild(cursorElement);
  
});



"""


async def get_page():
    global p, page
    if page is None:
        if p is None:
            p = await async_playwright().__aenter__()
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto(
            "https://editor.p5js.org/sarahriazati/full/fwfkAlo2D"
        )  # Replace with the desired URL
        await page.add_init_script(script=theRedDot)
        await page.add_script_tag(content=theRedDot)

    return page


def is_cursor_pointer(element):
    return element.evaluate('(el) => window.getComputedStyle(el).cursor === "pointer"')


oldPointer = ""


async def sendPointer(pointer, websocket):
    global oldPointer

    if pointer != oldPointer:
        oldPointer = pointer
        await websocket.send_text(json.dumps({"pointer": pointer}))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    page = await get_page()
    # await page.add_init_script(script=theRedDot)
    # await page.add_script_tag(content=theRedDot)

    # page.on("console", lambda msg:  sendPointer(msg.text,websocket))

    while True:
        # Receive URL from the client

        receive_task = asyncio.create_task(websocket.receive_text())

        # Wait for either a new URL or a timeout
        done, pending = await asyncio.wait(
            {receive_task}, timeout=0.01, return_when=asyncio.FIRST_COMPLETED
        )

        # If a new URL was received, navigate to it
        if receive_task in done:
            try:
                url = json.loads(receive_task.result())["url"]
                await page.goto(url)
                # await page.add_init_script(script=theRedDot)
                # await page.add_script_tag(content=theRedDot)
            except:
                pass

        if receive_task in done:
            try:
                control = json.loads(receive_task.result())["control"]
                print(control)
                if(control=="back"):
                    await page.go_back()
                if(control=="forward"):
                    await page.go_forward()
                if(control=="reload"):
                    await page.reload()

                # await page.add_init_script(script=theRedDot)
                # await page.add_script_tag(content=theRedDot)
            except:
                pass

        if receive_task in done:
            try:
                mousePosition = json.loads(receive_task.result())["mousePosition"]
                # print(mousePosition)
                await page.mouse.move(mousePosition["x"], mousePosition["y"])
            except:
                pass

        if receive_task in done:
            try:
                mouseClick = json.loads(receive_task.result())["mouseClick"]
                # print(mouseClick)
                await page.mouse.click(mousePosition["x"], mousePosition["y"])
            except:
                pass

        if receive_task in done:
            try:
                keyDown = json.loads(receive_task.result())["keyDown"]
                print(keyDown)
                await page.keyboard.press(keyDown)
            except:
                pass

        if receive_task in done:
            try:
                mouseWheel = json.loads(receive_task.result())["mouseWheel"]
                # print(mouseWheel)
                await page.mouse.wheel(mouseWheel["x"], mouseWheel["y"])
            except:
                pass

        # Cancel the receive task if it is still pending
        if receive_task in pending:
            receive_task.cancel()

        # await page.add_init_script(script=theRedDot)
        # await page.add_script_tag(content=theRedDot)
        # Take a screenshot of the page
        screenshot = await page.screenshot(type="png")

        # Convert the screenshot to OpenCV format
        img_array = np.frombuffer(screenshot, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        # Encode the image as base64
        _, encoded_image = cv2.imencode(".png", img)
        base64_image = base64.b64encode(encoded_image).decode("utf-8")

        # Send the base64-encoded image to the client
        await websocket.send_text(base64_image)

        # Wait for 2 seconds before taking the next screenshot
        # await asyncio.sleep(0.5)


@app.websocket("/ws_page_content")
async def websocket_endpoint_page_content(websocket: WebSocket):
    await websocket.accept()
    page = await getSimplePage()
    while True:
        try:
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")
            visible_text = soup.get_text()
            await websocket.send_text(visible_text)
        except:
            pass
        await asyncio.sleep(5)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
