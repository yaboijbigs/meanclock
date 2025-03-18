import cv2
import numpy as np
import face_recognition
import time
import pygame
import os
import random

# Set this variable to 1 to show the camera feed
show_camera_feed = 1

# Initialize the camera using OpenCV instead of Picamera2
camera = cv2.VideoCapture(0)  # Use default camera (usually webcam)
if not camera.isOpened():
    print("Error: Could not open camera.")
    exit()

# Initialize pygame for audio playback
pygame.mixer.init()
if not pygame.mixer.get_init():
    print("Pygame mixer failed to initialize.")

# Function to play a random sound from the 'audio' folder
def play_sound():
    audio_dir = os.path.join(os.path.dirname(__file__), 'audio')
    
    # Create the audio directory if it doesn't exist
    if not os.path.exists(audio_dir):
        os.makedirs(audio_dir)
        print(f"Created audio directory at: {audio_dir}")
        print("Please add some .mp3 files to this directory.")
        return
        
    audio_files = [file for file in os.listdir(audio_dir) if file.endswith('.mp3')] # Adjust extension as needed

    if audio_files:
        sound_file = random.choice(audio_files)
        sound_path = os.path.join(audio_dir, sound_file)
        try:
            sound = pygame.mixer.Sound(sound_path)
            sound.play()
            print(f"Playing sound: {sound_file}")
        except Exception as e:
            print(f"Error playing sound: {e}")
    else:
        print(f"No audio files found in the 'audio' folder at {audio_dir}.")
        print("Please add some .mp3 files to this directory.")

# Function to detect eyes looking at the camera using improved checks
def is_looking_at_camera(face_landmarks):
    left_eye = face_landmarks['left_eye']
    right_eye = face_landmarks['right_eye']
    nose_tip = np.mean(face_landmarks['nose_tip'], axis=0)

    left_eye_center = np.mean(left_eye, axis=0)
    right_eye_center = np.mean(right_eye, axis=0)

    # Calculate the eye line angle
    eye_line_angle = np.arctan2(right_eye_center[1] - left_eye_center[1], right_eye_center[0] - left_eye_center[0])
    eye_line_angle = np.degrees(eye_line_angle)

    # Calculate the distance ratios between pupils and nose
    left_eye_nose_distance = np.linalg.norm(left_eye_center - nose_tip)
    right_eye_nose_distance = np.linalg.norm(right_eye_center - nose_tip)
    eye_nose_ratio = left_eye_nose_distance / right_eye_nose_distance if right_eye_nose_distance else 0  # Avoid division by zero

    # Threshold for eye angle and ratio
    angle_threshold = -8 < eye_line_angle < 8
    nose_ratio_threshold = 0.9 < eye_nose_ratio < 1.1

    return angle_threshold and nose_ratio_threshold

# Variables for tracking stare duration
stare_start_time = None
stare_duration_threshold = 4  # seconds

while True:
    # Capture frame using OpenCV
    ret, frame = camera.read()
    if not ret:
        print("Error: Failed to capture image")
        break

    # Convert the image from BGR color (OpenCV) to RGB color (face_recognition)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Find all face locations and face landmarks
    face_locations = face_recognition.face_locations(rgb_frame)
    face_landmarks = face_recognition.face_landmarks(rgb_frame, face_locations)

    current_time = time.time()
    staring = False

    for landmarks in face_landmarks:
        if is_looking_at_camera(landmarks):
            if stare_start_time is None:
                stare_start_time = current_time  # Start timing the stare
        else:
            # Calculate how long the person has been staring
            if stare_start_time is not None:
                stare_duration = current_time - stare_start_time
                if stare_duration >= stare_duration_threshold:
                    print(f"Stare detected! Duration: {stare_duration:.2f} seconds")
                    play_sound()
                    staring = True
                stare_start_time = None  # Reset for next detection

    # Draw a rectangle around the face and display the text if staring
    for (top, right, bottom, left) in face_locations:
        if staring:
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, "Looking at Camera!", (left, top - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    if not face_locations:  # If no faces detected
        stare_start_time = None  # Reset if no faces found

    # Conditionally display the resulting frame
    if show_camera_feed == 1:
        cv2.imshow('Video', frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up
camera.release()
pygame.mixer.quit()
if show_camera_feed == 1:
    cv2.destroyAllWindows()