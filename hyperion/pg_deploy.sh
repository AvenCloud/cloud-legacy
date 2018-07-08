#!/bin/bash

sudo -u postgres psql -c "alter user cloud with encrypted password '`echo /SETUP_PG_PASS.txt`'"
