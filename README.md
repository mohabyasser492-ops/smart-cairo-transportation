# Smart Cairo Transportation Network Optimization

## Stack
- React + Vite frontend
- Python FastAPI backend
- Python/scikit-learn ML traffic prediction bonus
 
## Data
Ready JSON data is stored in:

```text
backend/app/data/
```

## GitHub Workflow
Keep `main` as the stable branch with the prepared structure and data.
Create feature branches from `main` or from a future `dev` branch when your team starts coding.

## Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run Frontend

```bash
cd frontend-react
npm install
npm install react-router-dom framer-motion
npm run dev
```

## Docker

```bash
docker compose up --build
```
## Overview
The Smart Cairo Transportation Network Optimization System is a full-stack smart transportation platform designed for Greater Cairo. The project models the city transportation network as a weighted graph and applies multiple algorithmic techniques to solve real-world transportation problems in one integrated system.


## The platform combines:

-  shortest-path route planning
-  emergency vehicle routing
-  traffic-aware routing
-  infrastructure planning
-  public transit optimization
-  traffic signal optimization
-  traffic prediction
-  algorithm comparison and visualization

This project was developed as part of the CSE112 – Design and Analysis of Algorithms course.

## Problem Statement
Greater Cairo faces several transportation challenges such as:

-  heavy traffic congestion
-  delayed emergency response
-  inefficient public transportation allocation
-  difficulty in planning low-cost infrastructure improvements
-  traffic conditions that change throughout the day

## This project addresses these problems using a combination of:

- graph algorithms
- dynamic programming
- greedy optimization
- visualization and performance comparison


## Main Features
- Routing & Navigation

- Standard shortest-path route planning
- Emergency routing for critical vehicles
- Time-dependent traffic-aware routing
- Route comparison and analysis

## Infrastructure Optimization

- Minimum Spanning Tree for low-cost infrastructure design
- Expansion planning
- Maintenance planning under budget constraints

## Public Transit

- Bus allocation optimization
- Demand-aware transportation planning
- Transit route analysis

## Traffic Management

- Traffic signal optimization
- Congestion hotspot prioritization
- Signal timing recommendations

- Prediction & Analysis

## Traffic prediction bonus module
- Interactive result visualization
- Algorithm comparison views
- Runtime and visited-node analysis


## Algorithms Used
1. Kruskal’s Minimum Spanning Tree
- Used for:

- infrastructure planning
- expansion analysis
- connecting areas with minimum total cost

2. Dijkstra’s Algorithm
- Used for:

- standard shortest-path route planning
- route cost calculation
- baseline comparison

3. A* Search Algorithm
- Used for:

- emergency routing
- goal-directed pathfinding
- reducing explored nodes compared to standard shortest path search

4. Time-Dependent Routing
- Used for:

- routing under changing traffic conditions
- realistic route recommendations based on time of day

5. Dynamic Programming
- Used for:

- bus allocation
- maintenance planning
- optimization under resource constraints

6. Greedy Algorithm
- Used for:

- traffic signal optimization
- fast prioritization of high-congestion intersections