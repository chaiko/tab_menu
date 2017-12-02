#! /bin/bash

TARGET=tab_menu.zip

zip $TARGET           \
    manifest.json     \
    popup.*           \
    *.png             \
    jquery.min.js     \
    jquery-ui.min.js  \
    LICENSE.txt       \
    README.md
