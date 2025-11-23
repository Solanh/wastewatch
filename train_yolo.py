from ultralytics import YOLO
import torch


def main():
    # Check GPU
    print("cuda available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("device 0:", torch.cuda.get_device_name(0))
        device = 0         # use your RTX 3060
    else:
        print("no gpu, falling back to CPU")
        device = "cpu"

    model = YOLO("yolov8n.pt")

    model.train(
        data="fooddataset.yaml",
        epochs=2,
        imgsz=640,
        batch=4,
        device=device,
        workers=0,   # IMPORTANT on Windows to avoid multiprocessing crash
    )

    # Optional:
    # model.val(device=device)


if __name__ == "__main__":
    main()