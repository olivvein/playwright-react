## A Browser with full capabilities in your react app

The browser run in local on your computer
use playwright to have a full capable browser

Perfect for hooking a AI to the web

## to do :

[ ] Add audio

[ ] Improve mouse latency (scroll)

[ ] Add Right Click


# how to run

## run the server

```
cd server
pip install -r requirements.txt
python server.py
```

using docker (best option)
```
cd server
docker build -t play-server .
docker run -p 8000:8000 play-server
```


## run the client

```
cd play-react
pnpm install 
pnpm run dev
```