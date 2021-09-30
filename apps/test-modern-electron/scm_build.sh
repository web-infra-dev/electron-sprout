#!/bin/bash
. /etc/profile

set -e

yarn setup

yarn deploy
