# Smart Transformer Oil Purification Platform

![Python](https://img.shields.io/badge/Python-3.10-blue)
![IoT](https://img.shields.io/badge/IoT-Enabled-green)
![Machine Learning](https://img.shields.io/badge/ML-Predictive-orange)
![Streamlit](https://img.shields.io/badge/Dashboard-Streamlit-red)

An ICT-based intelligent monitoring and predictive analytics platform for adsorption-driven transformer oil purification. The system combines adsorption experiments, IoT sensor monitoring, machine learning prediction, and real-time dashboards to optimize transformer oil purification performance.

The platform demonstrates a complete cyber-physical monitoring loop:

```text
Transformer Oil Sample
        ->
Adsorption Purification Reactor
        ->
IoT Sensors (Temperature, pH, Turbidity, TDS)
        ->
Data Acquisition System
        ->
Cloud / Database Storage
        ->
Machine Learning Prediction Engine
        ->
Smart Dashboard
        ->
Decision Support System
        ->
Optimized Transformer Oil Purification
```

## Problem Statement

Transformer oil is critical for insulation and cooling in power transformers. During operation, contaminants such as moisture, oxidation products, and dissolved impurities accumulate in the oil, reducing dielectric strength and overall transformer reliability.

Traditional purification approaches focus primarily on laboratory testing and post-process analysis. Operators often lack real-time visibility into adsorption performance and contaminant removal efficiency.

This project addresses that challenge by integrating adsorption experiments, IoT-based sensing, and machine learning to create an intelligent monitoring and predictive platform.

## Research Motivation

Current transformer oil purification systems typically answer:

```text
Was the oil purified successfully after the experiment?
```

This project answers:

```text
Can adsorption performance be monitored,
predicted, and optimized in real time?
```

## Architecture

```text
+--------------------+
| Transformer Oil    |
| Sample Collection  |
+---------+----------+
          |
          v
+--------------------+
| Initial Oil        |
| Analysis (HPLC)    |
+---------+----------+
          |
          v
+--------------------+
| Adsorption Reactor |
| Fuller Earth       |
+---------+----------+
          |
          v
+--------------------+
| IoT Sensors        |
| Temp / pH / TDS    |
| Turbidity          |
+---------+----------+
          |
          v
+--------------------+
| Data Acquisition   |
| Microcontroller    |
+---------+----------+
          |
          v
+--------------------+
| Cloud Database     |
| MySQL              |
+---------+----------+
          |
          v
+--------------------+
| Data Processing    |
| Pandas             |
+---------+----------+
          |
          v
+--------------------+
| Machine Learning   |
| Prediction Engine  |
+---------+----------+
          |
          v
+--------------------+
| Streamlit          |
| Dashboard          |
+---------+----------+
          |
          v
+--------------------+
| Decision Support   |
| Recommendations    |
+--------------------+
```

## Objectives

1. Investigate adsorption-based purification of transformer oil using Fuller Earth.
2. Quantify contaminant concentration using HPLC analysis.
3. Develop an IoT monitoring platform for real-time adsorption tracking.
4. Build machine learning models for adsorption efficiency prediction.
5. Create an intelligent dashboard for monitoring and decision support.

## Key Features

### Real-Time Monitoring

The system continuously monitors:

* Temperature
* pH
* TDS
* Turbidity

### Adsorption Analytics

The platform evaluates adsorption behavior using:

* Langmuir Adsorption Isotherm
* Freundlich Adsorption Isotherm

### Predictive Intelligence

Machine learning models estimate:

* Adsorption Efficiency
* Contaminant Removal
* Purification Performance
* Adsorption Capacity

### Smart Dashboard

Provides:

* Real-Time Sensor Monitoring
* Adsorption Curves
* Performance Predictions
* System Alerts
* Maintenance Recommendations

## Technology Stack

| Component            | Technology   |
| -------------------- | ------------ |
| Programming Language | Python       |
| Machine Learning     | Scikit-Learn |
| Deep Learning        | TensorFlow   |
| Data Analysis        | Pandas       |
| Visualization        | Matplotlib   |
| Dashboard            | Streamlit    |
| Database             | MySQL        |

## Hardware Requirements

| Component                |
| ------------------------ |
| Batch Adsorption Reactor |
| Fuller Earth Adsorbent   |
| Temperature Sensor       |
| TDS Sensor               |
| Turbidity Sensor         |
| pH Probe                 |
| Magnetic Stirrer         |
| HPLC System              |

## Project Structure

```text
smart-transformer-oil-purification/
│
├── data/
├── models/
├── dashboard/
├── sensors/
├── notebooks/
├── docs/
│   └── images/
├── README.md
├── requirements.txt
└── app.py
```

## Machine Learning Pipeline

### Input Features

* Temperature
* pH
* TDS
* Turbidity
* Adsorbent Dosage
* Contact Time
* Initial Contaminant Concentration

### Output Predictions

* Adsorption Efficiency (%)
* Contaminant Removal (%)
* Adsorption Capacity
* Recommended Operating Conditions

### Candidate Models

* Random Forest Regressor
* Gradient Boosting Regressor
* Support Vector Regression
* Neural Networks

## Adsorption Isotherm Module

The platform automatically determines the most suitable adsorption model.

### Langmuir Model

Assumes:

* Monolayer adsorption
* Homogeneous surface adsorption

### Freundlich Model

Assumes:

* Multilayer adsorption
* Heterogeneous surface adsorption

The system compares model performance and recommends the best-fitting adsorption isotherm.

## Interdisciplinary Contributions

### Chemical Engineering

* Adsorption Processes
* Adsorption Isotherm Analysis
* Transformer Oil Purification

### Electrical Engineering

* Transformer Operation
* Insulation and Cooling Systems
* Transformer Oil Quality Assessment

### Computer Science & Data Science

* Machine Learning
* Predictive Analytics
* Dashboard Development
* Data Processing

### IoT & Instrumentation

* Sensor Integration
* Real-Time Monitoring
* Data Acquisition Systems

## Innovation

The major innovation of this project is the integration of:

```text
Adsorption Experiments
+
IoT Monitoring
+
Machine Learning Prediction
+
Automated Isotherm Identification
```

into a single intelligent monitoring framework.

Unlike traditional transformer oil purification approaches that rely on manual laboratory analysis, the proposed platform provides:

* Continuous Monitoring
* Predictive Analytics
* Automated Adsorption Model Selection
* Real-Time Decision Support
* Smart Maintenance Recommendations

## Expected Outcomes

* Improved Transformer Oil Purification Efficiency
* Reduced Maintenance Costs
* Enhanced Transformer Reliability
* Real-Time Process Visibility
* Data-Driven Process Optimization
* Predictive Maintenance Support

## Future Work

* Edge AI Deployment for On-Device Predictions
* Cloud-Based Monitoring Platform
* Predictive Maintenance Alerts
* Digital Twin of Adsorption Process
* Explainable AI for Adsorption Prediction
* Industrial Scale Deployment

## Team

### Project Title

**Design of an ICT-Based Smart Monitoring and Predictive System for Adsorption-Driven Transformer Oil Purification**

### Team Members

| Name                  | Department           |
| --------------------- | -------------------- |
| Supreet Naik          | Chemical Engineering |
| Sriprada Ramesh       | Chemical Engineering |
| Janani S              | CSE (Data Science)   |
| Pravalika Nagappagari | CSE (Data Science)   |

### Guide

**Dr. C. Suresha**
Assistant Professor
Department of Electrical and Electronics Engineering

## One-Line Explanation

A smart IoT and machine learning platform that predicts adsorption performance and optimizes transformer oil purification through real-time monitoring, automated isotherm analysis, and predictive analytics.
