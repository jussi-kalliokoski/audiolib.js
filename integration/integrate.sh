#!/usr/bin/env sh

echo "Integrating fft.js..."
cat append-to-fft.js > ../js/process/fft.js
echo "\n" >> ../js/process.fft.js
cat fft.js/fft.js >> ../js/process/fft.js

echo "Integrating pcmdata.js..."
cat prepend-pcmdata.js > ../js/io/pcmdata.js
echo "\n" >> ../js/io/pcmdata.js
cat pcmdata.js/lib/pcmdata.js >> ..js/io/pcmdata.js

echo "Integrating sink.js..."
cat sink.js > ../js/io/sink.js

echo "Integration script done."
