#!/usr/bin/env sh

echo "Integrating fft.js..."
cat fft.js/fft.js > ../src/processors/fft.js
echo "" >> ../src/processors/fft.js
cat append-fft.js >> ../src/processors/fft.js

echo "Integrating pcmdata.js..."
cat prepend-pcmdata.js > ../src/io/pcmdata.js
echo "" >> ../src/io/pcmdata.js
cat pcmdata.js/lib/pcmdata.js >> ../src/io/pcmdata.js

echo "Integrating sink.js..."
cat sink.js/sink.js > ../src/io/sink.js

echo "Integration script done."
