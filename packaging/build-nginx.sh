#!/bin/bash

mkdir build
pushd build

mkdir dependencies
pushd dependencies

wget ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/pcre-8.31.tar.gz
wget http://zlib.net/zlib-1.2.7.tar.gz

tar xzf pcre-8.31.tar.gz
tar xzf zlib-1.2.7.tar.gz

popd

wget http://nginx.org/download/nginx-1.2.2.tar.gz
tar xzf nginx-1.2.2.tar.gz

pushd nginx-1.2.2

#os_friendly_name=""
unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
    os_friendly_name='OSX'
   ./configure --with-pcre="../dependencies/pcre-8.31" --with-zlib="../dependencies/zlib-1.2.7" --prefix="./nginx_data" --with-cc-opt="-DNGX_HAVE_ACCEPT4=0" --with-ld-opt="-static-libgcc -lc" --with-http_gzip_static_module
else
    os_friendly_name='Linux'
   ./configure --with-pcre="../dependencies/pcre-8.31" --with-zlib="../dependencies/zlib-1.2.7" --prefix="./nginx_data" --with-cc-opt="-DNGX_HAVE_ACCEPT4=0" --with-ld-opt="-static-libgcc -Wl,-Bstatic -lc" --with-http_gzip_static_module
fi

make

rm -rf ../../nginx_dist
mkdir -p ../nginx_dist/nginx_data/logs
cp -r conf ../nginx_dist/nginx_data
cp objs/nginx ../nginx_dist
mv ../nginx_dist ../..
popd

rm -f nginx_dist/nginx_data/conf/nginx.conf

popd

rm -rf build

echo "Nginx package for $os_friendly_name built."