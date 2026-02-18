# WasteWatch 🍽️

A comprehensive food waste tracking and management system that helps cafeterias, restaurants, and food service providers monitor, analyze, and reduce food waste through AI-powered insights and real-time tracking.

## 🎯 Overview

WasteWatch is a full-stack application that combines computer vision, data analytics, and an intuitive user interface to tackle food waste in institutional settings. The system uses YOLO (You Only Look Once) object detection to identify food items, tracks consumption patterns, and provides actionable insights through AI-generated reports.

## ✨ Features

### Core Functionality
- **AI-Powered Food Recognition**: Uses YOLOv8 model trained on 498+ food categories
- **Camera Integration**: Real-time food detection using Raspberry Pi camera or webcam
- **Real-time Waste Tracking**: Monitor leftover and wasted food items across different meal periods
- **Menu Management**: Create, edit, and manage daily menus with quantity tracking
- **Interactive Dashboard**: Visualize waste patterns with charts and analytics
- **Smart Reports**: AI-generated insights using Google Gemini API to identify waste patterns and provide recommendations
- **Multi-Period Support**: Track breakfast, lunch, dinner, and snacks separately
- **Historical Analysis**: View waste data by day, week, or month

### Analytics & Insights
- Individual item waste tracking (leftovers vs. explicitly wasted)
- Total waste calculations and percentages
- Menu-specific and time-based reporting
- AI recommendations for menu optimization

## 🛠️ Technology Stack

### Frontend
- **React 19** with Vite for fast development
- **React Router** for navigation
- **Bootstrap 5** for responsive UI
- **Recharts & Chart.js** for data visualization
- **React Markdown** for formatted reports

### Backend
- **FastAPI** (Python) for REST API
- **MongoDB** for data persistence
- **Google Gemini API** for AI-powered insights
- **PyMongo** for database operations

### Machine Learning
- **YOLOv8** (Ultralytics) for food detection
- **PyTorch** with CUDA support for GPU acceleration
- **OpenCV** for image processing
- **Picamera2** for Raspberry Pi camera integration
- Custom training on food dataset with 498 classes

### Additional Tools
- **Node.js/Express** for alternative server implementation
- **Python-dotenv** for environment configuration
- **CORS middleware** for cross-origin requests

## 📁 Project Structure

```
wastewatch/
├── waste-watch/              # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── data/            # Static data and configurations
│   │   └── App.jsx          # Main application component
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
│
├── waste-watch-server/       # FastAPI backend (main)
│   ├── main.py              # API endpoints and business logic
│   ├── database.py          # MongoDB connection
│   ├── models.py            # Pydantic models
│   └── requirements.txt     # Backend dependencies
│
├── waste_watch_server/       # Alternative server implementation
│   ├── main.py              # FastAPI endpoints
│   ├── database.py          # Database configuration
│   ├── server.js            # Node.js/Express server
│   └── start_cam.py         # Camera integration script
│
├── train_yolo.py            # YOLO model training script
├── best.pt                  # Trained YOLO model weights
├── fooddataset.yaml         # Dataset configuration (498 food classes)
└── requirements.txt         # Python dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **MongoDB** (local or MongoDB Atlas)
- **CUDA-capable GPU** (optional, for training)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Solanh/wastewatch.git
   cd wastewatch
   ```

2. **Set up Python environment**
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the backend**
   ```bash
   cd waste-watch-server
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the `waste-watch-server/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string
   ```

5. **Set up the frontend**
   ```bash
   cd ../waste-watch
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd waste-watch-server
   uvicorn main:app --reload --port 8000
   ```

3. **Start the frontend development server**
   ```bash
   cd waste-watch
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📖 Usage

### Creating a Menu

1. Navigate to "Menus" from the dashboard
2. Click "Add New Menu"
3. Enter menu name, select meal period (1=Breakfast, 2=Lunch, 3=Dinner, 4=Snacks)
4. Add food items with quantities
5. Save the menu

### Tracking Waste

1. Select a menu from the menu list
2. Update "Taken" and "Wasted" quantities for each item
3. The system automatically calculates leftovers (Quantity - Taken)
4. View real-time waste statistics on the dashboard

### Generating Reports

1. Go to the "Reports" page
2. Select a menu or time scope (day/week/month)
3. View AI-generated insights and recommendations
4. Analyze waste patterns through interactive charts

### Training the Model (Optional)

If you want to retrain the YOLO model:

```bash
python train_yolo.py
```

The script will:
- Check for GPU availability
- Load YOLOv8n base model
- Train on the food dataset for specified epochs
- Save the best model weights

### Using Camera Detection

To use real-time camera detection (Raspberry Pi):

```bash
cd waste_watch_server
python start_cam.py
```

Features:
- Real-time food detection with confidence threshold (0.3)
- Automatic waste tracking for detected items
- Visual feedback with annotated frames
- Press 'q' to quit and save detected items

## 🔌 API Endpoints

### Food Items & Listings
- `POST /listing` - Create a new food item listing
- `GET /listing` - Get all listings
- `GET /listing/{name}` - Get listings by food name
- `PUT /items/{item_id}` - Increment waste count for an item

### Menus
- `GET /api/menus` - List all menus
- `POST /api/menus` - Create a new menu
- `GET /api/menus/{menu_id}` - Get menu details
- `PUT /api/menus/{menu_id}` - Update a menu
- `DELETE /api/menus/{menu_id}` - Delete a menu

### Analytics
- `GET /api/summary` - Get AI-generated waste summary with recommendations
  - Query params: `menu_id` (optional), `scope` (menu/day/week/month)
- `GET /api/waste-summary` - Get raw waste statistics
  - Query params: `menu_id` (optional), `scope` (menu/day/week/month)

### Health Check
- `GET /health` - Check API health status

## 🎓 Food Categories

The system recognizes 498+ food categories including:
- Fruits and vegetables
- Proteins (meat, fish, eggs)
- Dairy products
- Grains and pasta
- Breads and baked goods
- Beverages
- Prepared meals and dishes
- Condiments and sauces

See `fooddataset.yaml` for the complete list.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Test your changes thoroughly
- Update documentation as needed
- Keep commits focused and descriptive

## 📝 License

This project is open source and available for educational and commercial use.

## 👥 Authors

- Sarina ([stalerico](https://github.com/stalerico))
- Solanh ([Solanh](https://github.com/Solanh))

## 🙏 Acknowledgments

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) for object detection
- [Google Gemini API](https://ai.google.dev/) for AI-powered insights
- Food dataset contributors
- Open source community

## 📧 Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API docs at `/docs` endpoint

---

**Built with ❤️ to reduce food waste and promote sustainability**
