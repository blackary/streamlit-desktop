#!/bin/bash
release_date="20221106"
filename="cpython-3.8.15+20221106-aarch64-apple-darwin-install_only.tar.gz"

standalone_python="python/"
destination_folder="$HOME/.streamlit-desktop/envs/default/"

# If the destination folder doesn't exist, download the standalone Python

if [ ! -d "$destination_folder" ]; then
    wget https://github.com/indygreg/python-build-standalone/releases/download/${release_date}/${filename}
    tar -xzvf ${filename}
    rm -rf ${filename}
    # Now delete the test/ folder, saving about 23MB of disk space
    rm -rf python/lib/python3.8/test

    mkdir -p ${destination_folder}

    # For now, just copy the python folder to the default Streamlit Desktop environment
    cp -r python/* ${destination_folder}

    # rm -rf python/
else
    echo "Python already exists in the default Streamlit Desktop environment"
fi