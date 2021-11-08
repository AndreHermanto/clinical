#!/bin/bash

if [ -d "/clinical/node_modules" ] 
then
    echo "Container already created"
    echo "Starting"
    npm start
else 

    echo "installing dependencies"
    npm ci

    echo "Starting"
    npm start
fi