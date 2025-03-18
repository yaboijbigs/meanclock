# **Mean Clock**  
### *A clock that detects when you're staring at it… and yells obscenities at you.*  

## **About**  
Mean Clock is an absurd yet functional project that uses a **Raspberry Pi and a camera module** to detect when someone is staring at the clock—and then **shouts custom insults** at them.  

Originally powered by **NEETS.AI** for celebrity text-to-speech, the project is now retired, but the source code is open for anyone who wants to revive (or modify) it.  

## **How It Works**  
1. A **camera module** mounted inside the clock detects faces.  
2. A **Python script** tracks eye positions to determine if someone is staring.  
3. If a "stare" is detected, the clock **plays a random audio file** from a local folder.  
4. (Previously) A **Flask web app** allowed users to generate and submit custom insults via NEETS.AI's API.  

## **Requirements**  
- **Hardware:** Raspberry Pi 4B (or similar), Raspberry Pi Camera Module, speakers  
- **Software:** Python 3, OpenCV, PiCamera2 (or an alternative camera library)  
- **(Optional)** A cloud storage setup for dynamic insult updates  

## **Setup**  
Run the flask app and get it working as a live website, replace the TTS NEETS connection with something else. Make a script that checks for new Audio files in your google cloud bucket. Run the stare_detector.py thats in /pythoncodeforclock/. Oh and you might have to recode the stare_detector.py to run on linux. Theres a whole blog post about it on jbigs.com

## **Known Issues & Notes**  
- **False positives/negatives**: The stare detection isn’t perfect, but it works well enough.  
- **NEETS.AI shut down**: The celebrity voice generator no longer works, but you can integrate another TTS API.  
- **Project is discontinued**: No further updates, but feel free to fork and modify.  

## **License**  
Do whatever you want with it, idc
