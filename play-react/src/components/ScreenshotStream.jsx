//file: playwrightServer/components/ScreenshotStream.tsx
import { useEffect, useRef, useState } from "react";
import MarkdownView from "./MarkdownView";

const ScreenshotStream= () => {
  const imageRef = useRef(null);
  const [url, setUrl] = useState("");
  const socketRef = useRef(null);
  const [theFocus, setTheFocus] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [timeSidebarMoved, setTimeSidebarMoved] = useState(0);
  

  useEffect(() => {
    const checkMousePosition = (e) => {
      if (e.clientX < 25) { // Changez cette valeur en fonction de la largeur de la zone sensible
        console.log("mouse is on the left");
        if (Date.now() - timeSidebarMoved > 1000) {
          setTimeSidebarMoved(Date.now());
          if (sidebarVisible) {
            console.log("Set to not visible");
            setSidebarVisible(false);
          }
          else {
            console.log("Set to visible");
            setSidebarVisible(true);
          }
        }
      }
      if (e.clientX > window.innerWidth/5) { 
        setSidebarVisible(false);
      }
    };
  
    window.addEventListener('mousemove', checkMousePosition);
  
    return () => {
      window.removeEventListener('mousemove', checkMousePosition);
    };
  }, [sidebarVisible]);


  useEffect(() => {
    const socket = new WebSocket("ws://macbook-pro-de-olivier.local:8000/ws");
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const base64Image = event.data;
      if (imageRef.current) {
        imageRef.current.src = `data:image/png;base64,${base64Image}`;
        //add keydown event listener to the parent
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const [pageContent, setPageContent] = useState("");

  const socketContentRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(
      "ws://macbook-pro-de-olivier.local:8000/ws_page_content"
    );
    socketContentRef.current = socket;

    socket.onmessage = (event) => {
      const content = event.data;
      //console.log(content);
      setPageContent(content);
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleNavigate = (e) => {
    console.log("navigate")
    try {
      e.preventDefault();
    } catch (e) {
      console.log(e);
    }

    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ url }));
      setUrl("");
    }
  };

  const navigateTo = (e,theUrl) => {
    console.log("navigate")
    try {
      e.preventDefault();
    } catch (e) {
      console.log(e);
    }

    if (socketRef.current) {
      console.log("sending url");
      socketRef.current.send(JSON.stringify({ url:theUrl }));
      setUrl("");
    }
  };


  const [timeMouseMouseMoved, setTimeMouseMouseMoved] = useState(0);

  const sendMouseMouve = (event) => {
    if (theFocus == false) {
      return;
    }
    if (socketRef.current) {
      //make the mouse pointer invisible
      if (imageRef.current) {
        imageRef.current.style.cursor = "none";
        setTimeout(() => {
          if (imageRef.current) {
            imageRef.current.style.cursor = "auto";
          }
        }, 1000);
      }

      //get mouse position reative to image
      const rect = imageRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : 0;
      const y = rect ? event.clientY - rect.top : 0;

      //scale mouse position to window size
      const scaleX = imageRef.current?.naturalWidth
        ? imageRef.current.naturalWidth / imageRef.current.width
        : 1;
      const scaleY = imageRef.current?.naturalHeight
        ? imageRef.current.naturalHeight / imageRef.current.height
        : 1;

      const mousePosition = { x: x * scaleX, y: y * scaleY };

      //send mouse position every 100ms
      if (Date.now() - timeMouseMouseMoved > 100) {
        socketRef.current.send(JSON.stringify({ mousePosition }));
        setTimeMouseMouseMoved(Date.now());
      }
    }
  };

  const sendMouseClick = (event) => {
    if (theFocus == false) {
      return;
    }
    if (socketRef.current) {
      const rect = imageRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : 0;
      const y = rect ? event.clientY - rect.top : 0;

      //scale mouse position to window size
      const scaleX = imageRef.current?.naturalWidth
        ? imageRef.current.naturalWidth / imageRef.current.width
        : 1;
      const scaleY = imageRef.current?.naturalHeight
        ? imageRef.current.naturalHeight / imageRef.current.height
        : 1;

      const mouseClick = { x: x * scaleX, y: y * scaleY };
      socketRef.current.send(JSON.stringify({ mouseClick }));
    }
  };

  const sendKeyDown = (event) => {
    if (theFocus == false) {
      return;
    }

    if (socketRef.current) {
      console.log(event.key);
      socketRef.current.send(JSON.stringify({ keyDown: event.key }));
    }
  };

  useEffect(() => {
    // Ajouter l'écouteur d'événements lors du montage du composant
    window.addEventListener("keydown", sendKeyDown);

    //ad keydown to id imgContainer

    //onwheel event
    window.addEventListener("wheel", sendMouseWheel);

    // Supprimer l'écouteur d'événements lors du démontage du composant
    return () => {
      window.removeEventListener("keydown", sendKeyDown);
      window.removeEventListener("wheel", sendMouseWheel);
    };
  }, [theFocus]);

  // eslint-disable-next-line no-unused-vars
  const [mouseWheelAcc, setMouseWheelAcc] = useState({ x: 0, y: 0 });

  const [timeMouseWheelMoved, setTimeMouseWheellMoved] = useState(0);

  const sendMouseWheel = (event) => {
    if (theFocus == false) {
      return;
    }
    event.preventDefault();
    if (socketRef.current) {
      console.log(event.deltaX, event.deltaY);
      const mouseWheel = { x: event.deltaX, y: event.deltaY };

      if (Date.now() - timeMouseWheelMoved > 500) {
        console.log(mouseWheelAcc);
        socketRef.current.send(JSON.stringify({ mouseWheel }));
        setTimeMouseWheellMoved(Date.now());
      }
    }
  };

  const sendBack = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ control: "back" }));
    }
  };

  const sendForward = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ control: "forward" }));
    }
  };

  const sendReload = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ control: "reload" }));
    }
  };

  const setFocus = () => {
    setTheFocus(true);
  };

  const removeFocus = () => {
    setTheFocus(false);
  };

  return (
    <div className="bg-white rounded-lg text-black h-1/2 w-full flex-col">
      <div className="w-full flex items-center justify-between p-2 bg-gray-300">
        <div>
          <button className="mx-1" onClick={sendBack}>
            ⬅️
          </button>
          <button className="mx-1" onClick={sendForward}>
            ➡️
          </button>
          <button className="mx-1" onClick={sendReload}>
            🔄
          </button>
        </div>
        <form onSubmit={handleNavigate} className="flex-grow mx-2">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter URL"
            className="text-black bg-white w-full"
          />
        </form>
        <div>
          <button className="mx-1">⭐️</button>
          <button className="mx-1">🔍</button>
        </div>
      </div>
      <div className="w-full h-full flex justify-between">
        <div id="sidebar" className={`w-1/5 h-1/2 my-2 px-2  ${sidebarVisible ? 'sidebarVisible' : 'sidebarHidden'}`}>
          <div className="overflow-scroll h-1/2 rounded-t-lg border border-black  p-4 backdrop-blur bg-blue-600/30">
            <ul className="w-full">
              <li>
                <button
                  onClick={(e) => {
                    navigateTo(e,"https://google.com");
                  }}
                >
                  Google 🔍{" "}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => {
                    navigateTo(e,"http://localhost:3000");
                  }}
                >
                  Localhost 🏠
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => {
                    navigateTo(e,"https://youtube.com");
                  }}
                >
                  youtube 📺{" "}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => {
                    navigateTo(e,"https://github.com/olivvein");
                  }}
                >
                  github 🐙{" "}
                </button>
              </li>
             
            </ul>
          </div>
          <div className="overflow-scroll h-40 rounded-b-lg border border-black  p-4 backdrop-blur bg-blue-600/30">
            <MarkdownView content={pageContent} />
          </div>
        </div>
        <div id="imgContainer" className={`w-4/5 h-4/5  aspect-video my-2 px-2 ${sidebarVisible ? 'imageVisible' : 'imageNotVisible'}`}>
          <img
            ref={imageRef}
            alt="Screenshot"
            onMouseEnter={setFocus}
            onMouseLeave={removeFocus}
            onMouseMove={sendMouseMouve}
            onClick={sendMouseClick}
            className={`rounded-lg border shadow-xl  bg-white/30  h-full  ${
              theFocus ? "border-red-400 border-2" : "border-black border-2"
            } h-full w-full `}
            src={""}
          />
        </div>
      </div>
    </div>
  );
};

export default ScreenshotStream;
