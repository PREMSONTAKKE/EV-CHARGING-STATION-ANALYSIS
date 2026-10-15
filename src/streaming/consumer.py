import os
import json
import sqlite3
import time
from datetime import datetime, timedelta
from kafka import KafkaConsumer

# Configuration
KAFKA_BROKER = "localhost:29092"
TOPIC_NAME = "ev-telemetry"
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed/grid_metrics.db"))

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS substation_metrics (
            window_start TIMESTAMP,
            window_end TIMESTAMP,
            substation_id TEXT,
            total_load_kw REAL,
            avg_voltage_v REAL,
            has_anomalies INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def main():
    init_db()
    print("Connecting to Kafka stream consumer...")
    
    consumer = KafkaConsumer(
        TOPIC_NAME,
        bootstrap_servers=[KAFKA_BROKER],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='latest'
    )

    print("Started Structured Streaming Window Processor...")
    print("--------------------------------------------------")

    window_data = {}  # {substation_id: {'load': [], 'voltage': [], 'anomalies': 0}}
    last_flush_time = time.time()

    try:
        for message in consumer:
            event = message.value
            sub_id = event.get("substation_id", "UNKNOWN")
            power_kw = event.get("power_kw", 0.0)
            voltage_v = event.get("voltage_v", 0.0)
            error_flag = event.get("error_flag", False)

            if sub_id not in window_data:
                window_data[sub_id] = {'load': [], 'voltage': [], 'anomalies': 0}

            window_data[sub_id]['load'].append(power_kw)
            window_data[sub_id]['voltage'].append(voltage_v)
            if error_flag:
                window_data[sub_id]['anomalies'] += 1

            # Flush/Write 5-second window batch to SQLite
            if time.time() - last_flush_time >= 5.0:
                now = datetime.utcnow()
                window_start = (now - timedelta(seconds=5)).isoformat()
                window_end = now.isoformat()

                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()

                for sub_id, stats in window_data.items():
                    if not stats['load']:
                        continue
                    total_load = sum(stats['load'])
                    avg_voltage = sum(stats['voltage']) / len(stats['voltage'])
                    anomalies = 1 if stats['anomalies'] > 0 else 0

                    cursor.execute('''
                        INSERT INTO substation_metrics 
                        (window_start, window_end, substation_id, total_load_kw, avg_voltage_v, has_anomalies)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (window_start, window_end, sub_id, round(total_load, 2), round(avg_voltage, 2), anomalies))

                    print(f"[WINDOW METRICS] {sub_id} | Total Load: {round(total_load, 2)} kW | Avg Volt: {round(avg_voltage, 1)}V | Anomalies: {anomalies}")

                conn.commit()
                conn.close()

                # Reset window data
                window_data = {}
                last_flush_time = time.time()

    except KeyboardInterrupt:
        print("Stopping streaming consumer.")

if __name__ == "__main__":
    main()
