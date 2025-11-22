from picamera2 import Picamera2
import cv2, time

picam2 = Picamera2()

config = picam2.create_preview_configuration(main={"format": "RGB888"})
picam2.configure(config)

picam2.start()
time.sleep(1)

while True:
    frame = picam2.capture_array()
    cv2.imshow("Camera Preview", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cv2.destroyAllWindows()
picam2.stop()