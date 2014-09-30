#!/bin/bash
#Builds the binaries for notedown.

echo "Clearing build cache"
rm prebuilt/cache/* -Rf

echo "Clearing prebuilt/src/*"
rm prebuilt/src/* -Rf

echo "Clearing previous-generated zips"
rm prebuilt/*.zip

echo "Moving latest build to prebuilt/src/"
cp node-webkit/* prebuilt/src/ -R

echo "Removing dev files"
rm prebuilt/src/nw
rm prebuilt/src/nw.pak

echo "Copying build files to cache";
cp prebuilt/src/* prebuilt/cache -R

#Generate zips.
#Win32
cp prebuilt/node-webkit-binaries/node-webkit-v0.10.5-win-ia32/* prebuilt/cache -R

echo "Change dir to prebuilt/cache"
cd prebuilt/cache
mv nw.exe notedown.exe
zip ../notedown-win32.zip ./* -r

echo "Leaving prebuilt/cache";
cd ../../

echo "Clearing build cache"
rm prebuilt/cache/* -Rf

#OSX32
echo "Copying build files to cache";
cp prebuilt/src/* prebuilt/cache -R
cp prebuilt/node-webkit-binaries/node-webkit-v0.10.5-osx-ia32/* prebuilt/cache -R

echo "Change dir to prebuilt/cache"
cd prebuilt/cache
zip ../notedown-mac32.zip ./* -r

echo "Leaving prebuilt/cache";
cd ../../

echo "Clearing build cache"
rm prebuilt/cache/* -Rf

#OSX64
echo "Copying build files to cache";
cp prebuilt/src/* prebuilt/cache -R
cp prebuilt/node-webkit-binaries/node-webkit-v0.10.5-osx-x64/* prebuilt/cache -R

echo "Change dir to prebuilt/cache"
cd prebuilt/cache
zip ../notedown-mac64.zip ./* -r

echo "Leaving prebuilt/cache";
cd ../../

echo "Clearing build cache"
rm prebuilt/cache/* -Rf

#*Nix32
echo "Copying build files to cache";
cp prebuilt/src/* prebuilt/cache -R
cp prebuilt/node-webkit-binaries/node-webkit-v0.10.5-linux-ia32/* prebuilt/cache -R

echo "Change dir to prebuilt/cache"
cd prebuilt/cache
mv nw notedown
zip ../notedown-linux32.zip ./* -r

echo "Leaving prebuilt/cache";
cd ../../

echo "Clearing build cache"
rm prebuilt/cache/* -Rf

#*Nix64
echo "Copying build files to cache";
cp prebuilt/src/* prebuilt/cache -R
cp prebuilt/node-webkit-binaries/node-webkit-v0.10.5-linux-x64/* prebuilt/cache -R

echo "Change dir to prebuilt/cache"
cd prebuilt/cache
mv nw notedown
zip ../notedown-linux64.zip ./* -r

echo "Leaving prebuilt/cache";
cd ../../

echo "Clearing build cache"
rm prebuilt/cache/* -Rf

