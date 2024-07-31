# Create Category Service

This is the microservice for create a nuew category in the +Kotas App.

## Group Members

- Christopher Pallo
- Brayan Dávila

## Table of Contents

1. [Microservice Description](#microservice-description)
2. [Installation](#installation)
   - [Requirements](#requirements)
   - [Clone the Repository](#clone-the-repository)
   - [Install Dependencies](#install-dependencies)
   - [Start the Server](#start-the-server)
   - [Evidence](#evidence)
3. [Usage](#usage)
   - [Verify Server Functionality](#verify-server-functionality)


## Microservice Description

The `create-category-service` microservice is responsible for managing the list of users in the +kotas App. Allows you to list products using an HTTP POST request to the corresponding route.

## Installation

### Requirements

- Node.js
- npm (Node Package Manager)

### Clone the Repository

```sh
https://github.com/ChristopherPalloArias/gr8-create-category-service.git
cd create-category-service
```

### Install Dependencies
```sh
npm install
```

### Starting the Server
Before starting the application you must change the database credentials in the index.js file if you want to use the application locally and independently, this is because initially the application is configured to be used in conjunction with the rest of Microservices.
Repository: [https://github.com/ChristopherPalloArias/kotas-frontend](https://github.com/ChristopherPalloArias/kotas-frontend.git)

### Evidence
![image](https://github.com/user-attachments/assets/063b731d-ae40-4c55-8bbd-67ece7bbdd55)


## Usage
### Verify Server Functionality

Method: POST  
URL: `gr8-load-balancer-category-1676330872.us-east-2.elb.amazonaws.com:8086`  
Description: This route displays a message to verify that the server is running.
![image](https://github.com/user-attachments/assets/eacbc144-f681-4c86-8072-44cb101baa1f)

