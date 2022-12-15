#!/bin/bash

if [ ! -d "../consensus/prysm" ]; then
    git clone https://github.com/flashbots/prysm.git ../consensus/prysm
    docker build -t eth-pos-devnet_beacon-chain:latest -f ../consensus/Dockerfile consensus/prysm
fi

if [ ! -d "../execution/builder" ]; then
    git clone https://github.com/flashbots/builder.git ../execution/builder
    cd ../execution/builder
    git checkout 1f2047d7894d01c1526673c7ab33873fcae78abd
    cd ../../e2e
    docker build -t eth-pos-devnet_geth:latest ../execution/builder
fi

docker-compose up -d