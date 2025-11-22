import cv2
import matplotlib.pyplot as plt
from pathlib import Path

image_path = "waste-watch-server/datasets/training/img/007389.jpg"
label_path = "food_yolo/labels/training/007389.jpg.txt"
classes_path = "food_yolo/classes.txt"

# Load image
img = cv2.imread(image_path)
h, w, _ = img.shape

# Load classes
with open(classes_path) as f:
    classes = [line.strip() for line in f]

with open(label_path) as f:
    for line in f:
        cls_id, x_center, y_center, bw, bh = map(float, line.strip().split())
        x1 = int((x_center - bw/2) * w)
        y1 = int((y_center - bh/2) * h)
        x2 = int((x_center + bw/2) * w)
        y2 = int((y_center + bh/2) * h)

        cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 2)

        label = classes[int(cls_id)]
        cv2.putText(img, label, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, (0,255,0), 1, cv2.LINE_AA)

plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
plt.axis('off')
plt.show()
