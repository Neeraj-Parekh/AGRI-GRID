# ThingsBoard IoT Platform - Integration Guide

- **Source:** ThingsBoard.io
- **Year:** 2024
- **URL:** https://thingsboard.io/docs/user-guide/integrations/
- **Type:** Platform Documentation / Tutorial
- **Relevance to AGRI-GRID:** ThingsBoard is the cloud platform used for data visualization, device management, and rule engine processing of agricultural sensor data.

## Summary
ThingsBoard is an open-source IoT platform for device management, data collection, processing, and visualization. Supports MQTT, CoAP, HTTP, LwM2M, and SNMP APIs for device connectivity. Features rule engine for data processing, alarm management, dashboards with widgets, and multi-tenancy. Available as self-hosted (Docker, Ubuntu, Raspberry Pi) or cloud (AWS, GCP, Azure).

## Key Technical Details
- Device APIs: MQTT, CoAP, HTTP, LwM2M, SNMP
- Device SDKs: Python, MicroPython, CircuitPython, Arduino
- Integration Types: Cloud IoT Hub, Kafka, RabbitMQ, MQTT, REST API
- Data Processing: Rule Engine with filter/enrichment/transformation/action nodes
- Calculated Fields: Simple, Script, Geofencing, Related Entity Aggregation
- Visualization: Dashboards with 50+ widget types (charts, maps, SCADA)
- Alarms: Configurable alarm rules with email/SMS/Slack/Telegram notifications
- Multi-Tenancy: Hierarchical organization (Tenant → Customer → User)
- Deployment Options:
  - Docker (Linux, macOS, Windows)
  - Ubuntu, CentOS/RHEL
  - Raspberry Pi
  - AWS/GCP/Azure (EKS/GKE/AKS)
- Smart Farming Use Case: Remote soil & equipment monitoring
- Smart Irrigation Use Case: Soil moisture & irrigation control
- MQTT Topic Structure:
  - v1/devices/me/telemetry (telemetry data)
  - v1/devices/me/attributes (device attributes)
  - v1/devices/me/rpc (RPC commands)

## AGRI-GRID Citation
ThingsBoard serves as the central IoT platform for AGRI-GRID, receiving telemetry from LoRa sensor nodes via MQTT gateway. Rule chains process incoming soil moisture and pH data, triggering irrigation alerts when thresholds are exceeded. Dashboards display real-time field conditions for farmers, while historical data enables trend analysis for crop planning. The platform's REST API allows integration with existing farm management systems.
