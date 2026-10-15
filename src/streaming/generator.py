import os
import json
import time
import random
import uuid
from datetime import datetime
from kafka import KafkaProducer

# Configuration
KAFKA_BROKER = 'localhost:29092'
TOPIC_NAME = 'ev-telemetry'

# Substation and Station Configurations
STATIONS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed/stations.json"))
SUBSTATIONS = ["SUB-PA-01", "SUB-PA-02", "SUB-PA-03", "SUB-PA-04"]

stations = []
if os.path.exists(STATIONS_FILE):
    try:
        with open(STATIONS_FILE, "r") as f:
            raw_stations = json.load(f)
            for s in raw_stations:
                stations.append({
                    "station_id": s.get("station_id") or s.get("name"),
                    "substation_id": s.get("substation_id") or "SUB-PA-01",
                    "latitude": s["latitude"],
                    "longitude": s["longitude"],
                    "cluster_id": s.get("cluster_id", 1)
                })
        print(f"Loaded {len(stations)} real Palo Alto stations from {STATIONS_FILE}")
    except Exception as e:
        print(f"Warning: Failed to load stations.json ({e}), using default fallback.")

if not stations:
    for sub in SUBSTATIONS:
        for i in range(12):
            stations.append({
                "station_id": f"STN-{sub}-{i:03d}",
                "substation_id": sub,
                "latitude": round(random.uniform(37.42, 37.45), 5),  # Palo Alto bounding box
                "longitude": round(random.uniform(-122.16, -122.11), 5),
                "cluster_id": 1
            })

def generate_event(station):
    # Simulate realistic EV charging telemetry
    is_charging = random.random() < 0.3  # 30% chance a station is active
    
    if is_charging:
        voltage = random.normalvariate(400, 10) # 400V DC fast charging
        current = random.normalvariate(125, 20) # 125A
        power_kw = (voltage * current) / 1000.0
        soc = round(random.uniform(10, 90), 1)
        temp = random.normalvariate(35, 5)
        
        # Simulate anomalies
        error_flag = False
        if random.random() < 0.01: # 1% chance of voltage dropout anomaly
            voltage = random.uniform(0, 100)
            power_kw = 0
            error_flag = True
    else:
        voltage = 0
        current = 0
        power_kw = 0
        soc = 0
        temp = random.normalvariate(20, 3) # Ambient temp
        error_flag = False

    return {
        "event_id": str(uuid.uuid4()),
        "station_id": station["station_id"],
        "substation_id": station["substation_id"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "latitude": station["latitude"],
        "longitude": station["longitude"],
        "voltage_v": round(voltage, 2),
        "current_a": round(current, 2),
        "power_kw": round(power_kw, 2),
        "soc_percentage": soc,
        "temperature_c": round(temp, 2),
        "error_flag": error_flag,
        "status": "CHARGING" if is_charging else "IDLE"
    }

def main():
    print(f"Connecting to Kafka at {KAFKA_BROKER}...")
    try:
        producer = KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        print("Connected to Kafka. Starting telemetry simulation...")
    except Exception as e:
        print(f"Failed to connect to Kafka: {e}")
        return

    try:
        while True:
            # Simulate a batch of events (e.g., from a subset of stations every second)
            active_stations = random.sample(stations, k=int(len(stations) * 0.2)) # 20% reporting per cycle
            
            for station in active_stations:
                event = generate_event(station)
                producer.send(TOPIC_NAME, value=event)
            
            producer.flush()
            print(f"Sent {len(active_stations)} telemetry events to {TOPIC_NAME} at {datetime.now().strftime('%H:%M:%S')}")
            time.sleep(1) # Emit every 1 second
            
    except KeyboardInterrupt:
        print("Stopping telemetry generator.")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
