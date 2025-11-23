from picamera2 import Picamera2
from ultralytics import YOLO   
import cv2, requests
from main import increment_item_waste

picam2 = Picamera2()
config = picam2.create_preview_configuration(main={"format": "RGB888", "size": (1000, 750)})
picam2.configure(config)
picam2.start()

model = YOLO("/home/adpifive/Documents/wastewatch/best.pt")
acceptance_threshold = 0.3

seen_items = []

while True:
    frame = picam2.capture_array()
    results = model(frame)
    r = results[0]
    for box in r.boxes:
        conf = float(box.conf)
        class_id = int(box.cls)
        class_name = model.names[class_id]
        if class_name not in seen_items and conf >= acceptance_threshold:
            seen_items.append(class_name)
            print(f"Detected: {class_name}")
    annotated_frame = results[0].plot()
    cv2.imshow("YOLO Camera", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows() 
picam2.stop()
print("Seen items during session:", seen_items)

for item in seen_items:
    try:
        increment_item_waste(item)
        print(f"Successfully incremented waste for {item}")
    except Exception as e:
        print(f"Error incrementing waste for {item}: {e}")