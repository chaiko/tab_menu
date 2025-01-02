#! /bin/bash

TARGET=tab_menu.zip

zip $TARGET           \
    manifest.json     \
    popup.*           \
    options.*         \
    *.png             \
    background.js     \
    LICENSE.txt       \
    README.md
