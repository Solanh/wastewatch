import json
from pathlib import Path

DATASET_DIR = Path("waste-watch-server/datasets")
LABELS_DIR = Path("food_yolo/labels")

LABELS_DIR.mkdir(parents=True, exist_ok=True)

class2id = {}
classes = []

def polygon_to_box(polygon, imagewidth, imageheight):
    xs = [pt[0] for pt in polygon]
    ys = [pt[1] for pt in polygon]
    x_max = max(xs)
    x_min = min(xs)
    y_max = max(ys)
    y_min = min(ys)

    x_center = ((x_min + x_max)/2) / imagewidth
    y_center = ((y_min + y_max)/2) / imageheight

    width = (x_max - x_min) / imagewidth
    height = (y_max - y_min) / imageheight

    return x_center, y_center, width, height

for split in ["train", "val", "test"]:
    ann_dir = DATASET_DIR / split / "ann" #processes json annotations in each folder
    img_dir = DATASET_DIR / split / "img" 
    label_split_dir = LABELS_DIR / split #yolo .txt labels
    label_split_dir.mkdir(parents=True, exist_ok=True)

    for json_file in ann_dir.glob("*.json"):
        with open(json_file) as f:
            data = json.load(f)

        if len(data['objects']) == 0:
            continue  # skip JSOn if no obnjects

        img_name = Path(json_file).stem + ".jpg"
        width, height = data['size']['width'], data['size']['height']

        lines = []
        for obj in data['objects']:
            cls_name = obj['classTitle']
            if cls_name not in class2id:
                class2id[cls_name] = len(class2id)
                classes.append(cls_name)
            cls_id = class2id[cls_name]

            polygon = obj['points']['exterior']
            x_center, y_center, w, h = polygon_to_box(polygon, width, height)
            lines.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}")

        label_file = label_split_dir / f"{Path(img_name).stem}.txt"
        with open(label_file, "w") as f:
            f.write("\n".join(lines))

with open("food_yolo/classes.txt", "w") as f:
    for cls in classes:
        f.write(cls + "\n")