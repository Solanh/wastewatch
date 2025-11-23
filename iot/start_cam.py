from picamera2 import Picamera2
import cv2
from ultralytics import YOLO

picam2 = Picamera2()
config = picam2.create_preview_configuration(main={"format": 'RGB888', "size": (1000, 600)})
picam2.configure(config)
picam2.start()

model = YOLO("yolov8n.pt")

while True:
    frame = picam2.capture_array()

    results = model(frame)
    annotated_frame = results[0].plot()
    # Process the frame (for example, display or analyze)
    cv2.imshow("YOLO Camera", annotated_frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()
picam2.stop()