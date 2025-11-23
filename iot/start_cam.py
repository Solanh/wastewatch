from picamera2 import Picamera2
from ultralytics import YOLO   
import cv2 

picam2 = Picamera2()
config = picam2.create_preview_configuration(main={"format": "RBG888", "size": (640, 480)})
picam2.configure(config)
picam2.start()

model = YOLO("/home/adpifive/Documents/wastewatch/best.pt")

while True:
    frame = picam2.capture_array()
    results = model(frame, stream=True)
    r = results[0]
    for box in r.boxes:
        class_id = int(box.cls)
        class_name = model.names[class_id]
        print(f"Detected: {class_name}")
    annotated_frame = results[0].plot()
    cv2.imshow("YOLO Camera", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows() 
picam2.stop()