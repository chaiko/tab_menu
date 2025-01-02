#! /bin/bash

TARGET=tab_menu.zip

zip $TARGET           \
    manifest.json     \
    popup.*           \
    options.*         \
    *.png             \
    jquery.min.js     \
    jquery-ui.min.js  \
    background.js     \
    LICENSE.txt       \
    README.md
