'use client'

import styles from "@/app/page.module.css";
import './page.css';
import * as pdfjsLib from "pdfjs-dist";
import { useState, useEffect } from "react";
import BarLoader from "react-spinners/BarLoader";
import Image from "next/image";
import { open as openEmbed } from "@play-ai/web-embed";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

export default function Start() {
    const [pdf, setPdf] = useState(null);
    const webEmbedId = 'mgFbHb3KFupvn7cmVZZFK';

    const [currentPage, setCurrentPage] = useState(1);
    const [text, setText] = useState("Title: Hello world");
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inputPage, setInputPage] = useState("");
    const [fileUploaded, setFileUploaded] = useState(false);

    const events = [
      {
        name: "change-text",
        when: "The user says what they want to change the text on the screen to",
        data: {
          text: { type: "string", description: "The text to change to" },
        },
      },
    ];

    const onEvent = (event) => {
      console.log("onEvent: ", event);
      if (event.name === "change-text") {
        setText(event.data.text);
      }
    };

    function handleUpload(event) {
        const file = event.target.files[0];
        if (file) {
          setFileUploaded(true)
          const fileReader = new FileReader();
          fileReader.onload = function () {
            const typedArray = new Uint8Array(fileReader.result);
            loadPdf(typedArray);
          };
          fileReader.readAsArrayBuffer(file);
        }
      }

    async function loadPdf(data) {
        try {
          const loadedPdf = await pdfjsLib.getDocument(data).promise;
          setPdf(loadedPdf);
          loadPage(loadedPdf, 1);
        } catch (error) {
          console.error("Failed to load PDF:", error);
        }
      }

      async function loadPage(loadedPdf, pageNum) {
        try {
          if (pageNum < 1 || pageNum > loadedPdf.numPages) {
            alert(`Invalid page number. Please enter a number between 1 and ${loadedPdf.numPages}.`);
            return;
           }
          setAudioUrl(null);
          const page = await loadedPdf.getPage(pageNum);
          const canvas = document.getElementById("pdfCanvas");
          const context = canvas.getContext("2d");
          const viewport = page.getViewport({ scale: 1.5 });

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;

          const textContent = await page.getTextContent();
          const extractedText = textContent.items.map((item) => item.str).join(" ");
          const options = {
            events,
            onEvent,
            extractedText
          }
          openEmbed(webEmbedId, options);
          updateChatBot(extractedText)
          setText(extractedText);
        } catch (error) {
          console.error("Failed to load page:", error);
        }
      }

    function handlePageInput(event) {
        setInputPage(event.target.value);
    }

    function goToPage() {
      if (pdf) {
          const pageNum = parseInt(inputPage, 10);
          if (!isNaN(pageNum)) {
              loadPage(pdf, pageNum);
          }
      }
  }

    async function updateChatBot(text) {
      const options = {
        method: 'PATCH',
        headers: {
          AUTHORIZATION: `${process.env.AUTHORIZATION2}`,
          'X-USER-ID': `${process.env.USERID2}`,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: '{"prompt":"Page Content: ' + text + '"}'
      };

      fetch('https://api.play.ai/api/v1/agents/ChatBot-N403l_yyKZHZji0Im9LJJ', options)
      .then(response => response.json())
      .catch(err => console.error(err));
    }


    async function fetchAudio() {
      setLoading(true); // Start loading
      const extractedText = text;
      const options = {
        method: 'POST',
        headers: {
          AUTHORIZATION: `${process.env.AUTHORIZATION}`,
          'X-USER-ID': `${process.env.USERID}`,
          'Content-Type': 'application/json'
        },
        body: `{
        "model":"Play3.0-mini",
        "text":"${extractedText}",
        "voice":"s3://voice-cloning-zero-shot/90217770-a480-4a91-b1ea-df00f4d4c29d/original/manifest.json",
        "quality": "low",
        "speed": 1
        }`
      };

    try {
        const data = await fetch('https://api.play.ai/api/v1/tts/stream', options);
        const audioBlob = await data.blob();
        const audio = URL.createObjectURL(audioBlob);
        setAudioUrl(audio);
    } catch (error) {
        console.error("Error fetching audio:", error);
    } finally {
        setLoading(false); // Stop loading
    }
  }



    function handleNextPage() {
        if (pdf && currentPage < pdf.numPages) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadPage(pdf, nextPage);
        }
      }

    function handlePreviousPage() {
      if (pdf && currentPage > 1) {
        const nextPage = currentPage - 1;
        setCurrentPage(nextPage);
        loadPage(pdf, nextPage);
      }
    }

    return (
        <div className="start-container">
          <div className = "navbar">
            <Image
                className={'playai'}
                src="https://play.ai/img/PlayLogo-onDarkSurfaces.svg"
                alt="none"
                width={180}
                height={90}
              />
          </div>
          <div className = 'base-container'>
            <canvas id="pdfCanvas" style={{ border: "1px solid black", maxWidth: '40vw', maxHeight: '80vh' }}></canvas>
            {!loading && audioUrl && (
                <div>
                    <audio controls>
                        <source src={audioUrl} type="audio/mp3" />
                        Your browser does not support audio playback.
                    </audio>
                </div>
            )}
            {fileUploaded && loading &&
              <div className="loading-spinner">
                    <BarLoader
                      color={"#ffffff"}
                      loading={loading}
                      size={100}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
              </div>
              }
            <div className={styles.ctas}>
              <label htmlFor="file-upload" className="custom-file-upload">
                  Upload a File
              </label>
              <input id="file-upload" type='file' accept="application/pdf" onChange={handleUpload}/>
            </div>

          </div>
            <div className = "page-options">
              {fileUploaded &&
                <div className = "buttons">
                  <div className = 'page-input'>
                      <input
                          type="number"
                          value={inputPage}
                          onChange={handlePageInput}
                          placeholder="Enter page number"
                      />
                      <button className = "custom-file-upload" onClick={goToPage} disabled={!pdf || inputPage === ""}>
                          Go to Page
                      </button>
                  </div>


                  <button className = "custom-file-upload" onClick={handleNextPage} disabled={!pdf || currentPage >= pdf.numPages}>Next Page</button>
                  <button className = "custom-file-upload" onClick={handlePreviousPage} disabled={!pdf || currentPage == 1}>Previous Page</button>

            <button className = "custom-file-upload" onClick={fetchAudio}>Read</button>

            </div>
        }
        </div>
      </div>
    )
}