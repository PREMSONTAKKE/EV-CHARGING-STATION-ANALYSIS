# GridPulse: EV Smart Grid Analytics & Big Data Monitoring Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Apache Spark](https://img.shields.io/badge/Apache_Spark-3.5.0-E25A1C?style=flat&logo=apachespark&logoColor=white)](https://spark.apache.org/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-7.5.0-231F20?style=flat&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS_Mapping-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com/)

A real-time Big Data streaming and distributed machine learning platform designed to monitor smart grid stress, detect voltage anomalies, and predict optimal electric vehicle (EV) charging hub expansion locations.

---

## ⚡ Architecture Overview

```
[EV IoT Telemetry Generator] (src/streaming/generator.py)
              │
              ▼ (High-throughput real-time stream)
      [Apache Kafka Broker] (Confluent cp-kafka:7.5.0 + ZooKeeper)
              │
      ┌───────┴──────────────────────────────┐
      ▼                                      ▼
[Stream Consumer & Aggregator]    [Apache Spark MLlib]
  - 5s tumbling window batches      - 259,417 real-world Palo Alto sessions
  - Anomaly detection               - K-Means|| spatial clustering (k=3)
  - Substation peak loads           - Optimal charging hub centroids
      │                                      │
      └───────────────────┬──────────────────┘
                          ▼
            [FastAPI & WebSocket Server] (backend/main.py)
                          │
                          ▼
        [React + Leaflet + Chart.js Dashboard] (frontend/)
```

---

## 🚀 Key Features

- **Big Data Batch Layer (Apache Spark MLlib)**:
  - Ingests **259,417 authentic EV charging transactions** from the City of Palo Alto / ChargePoint open dataset.
  - Cleans and aggregates cumulative energy, session counts, and coordinates across **47 physical charging stations**.
  - Trains distributed spatial **K-Means clustering** to discover optimal grid expansion hub centroids.
- **Speed & Streaming Layer (Apache Kafka & ZooKeeper)**:
  - High-throughput message broker buffering real-time IoT charging telemetry (`ev-telemetry` topic).
  - Tumbling window consumer computing active power loads (kW), DC fast-charge bus voltages, and detecting voltage dropouts.
- **Real-Time Serving & WebSockets (FastAPI)**:
  - Provides REST endpoints for stations, ML centroids, and grid stress metrics.
  - Pushes live 2-second telemetry updates over WebSockets directly to the web client.
- **Interactive GIS Dashboard (React + Leaflet + Chart.js)**:
  - Interactive dark-mode GIS map with automatic bounding box fitting.
  - Heat aura overlays, charging status rings, and K-Means hub centroid circles.
  - Real-time time-series load trends with dynamic waveform scaling and pause/resume stream controls.

---

## 📊 Dataset

The platform is trained on the **City of Palo Alto / ChargePoint Open Dataset**:
- **Total Records**: 259,417 charging sessions
- **Physical Chargers**: 47 unique stations across Palo Alto, CA (Downtown Hamilton Ave, Bryant St, High St, Cambridge Ave)
- **Attributes**: Timestamp, Energy delivered (kWh), Total duration, Charging duration, Greenhouse Gas (GHG) savings, and GPS coordinates.
- Raw datasets are placed in `data/raw/` for the Spark pipeline.

---

## 🛠️ Tech Stack

- **Distributed Computing**: Apache Spark (PySpark 3.5.0), Hadoop WinUtils
- **Message Broker**: Apache Kafka (Confluent 7.5.0), Apache ZooKeeper
- **Backend API**: FastAPI, Uvicorn, SQLite
- **Machine Learning**: Spark MLlib (`KMeans`, `VectorAssembler`), Scikit-learn
- **Frontend**: React 19, Vite, Leaflet, React-Leaflet, Chart.js, React-ChartJS-2

---

## 📦 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (for Kafka & Spark containers)
- Java 17+ (for local PySpark execution)

### 2. Installation
```powershell
# Clone the repository
git clone https://github.com/PREMSONTAKKE/EV-CHARGING-STATION-ANALYSIS.git
cd EV-CHARGING-STATION-ANALYSIS

# Install Python dependencies
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Running Distributed ML Clustering (PySpark)
```powershell
python src/ml/clustering.py
```
*Outputs optimal charging hub centroids to `data/models/cluster_centroids.json` and 47 physical station profiles to `data/processed/stations.json`.*

### 4. Starting Kafka & Streaming (Optional / Containerized)
```powershell
# Launch Kafka and ZooKeeper
docker compose up -d

# Start IoT telemetry generator
python src/streaming/generator.py

# In another terminal, start stream consumer
python src/streaming/consumer.py
```

### 5. Launching the Application
```powershell
# Start FastAPI backend server
python -m uvicorn backend.main:app --port 8005 --reload

# In another terminal, start the React GIS dashboard
cd frontend
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.