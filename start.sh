#!/bin/bash
source ~/.nvm/nvm.sh
nvm use 20
cd /opt/content-ops-console
PORT=3210 npm start
