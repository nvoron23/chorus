#!/bin/bash

set -e

mkdir -p build
pushd build

mkdir -p dependencies
pushd dependencies

NGINX_VER=1.6.2
PCRE_VER=8.36
ZLIB_VER=1.2.8
OPENSSL_VER=0.9.8zc

wget ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/pcre-$PCRE_VER.tar.gz
wget http://zlib.net/zlib-$ZLIB_VER.tar.gz
wget http://www.openssl.org/source/openssl-$OPENSSL_VER.tar.gz

tar xzf pcre-$PCRE_VER.tar.gz
tar xzf zlib-$ZLIB_VER.tar.gz
tar xzf openssl-$OPENSSL_VER.tar.gz

popd

wget http://nginx.org/download/nginx-$NGINX_VER.tar.gz
tar xzf nginx-$NGINX_VER.tar.gz

pushd nginx-$NGINX_VER

#os_friendly_name=""
unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
    os_friendly_name='OSX'
#   ./configure --with-pcre="../dependencies/pcre-$PCRE_VER" --with-pcre-opt="-arch i386" --with-zlib="../dependencies/zlib-$ZLIB_VER" --with-zlib-opt="-arch i386" --with-openssl="../dependencies/openssl-$OPENSSL_VER" --prefix="./nginx_data" --with-cc-opt="-DNGX_HAVE_ACCEPT4=0 -arch i386" --with-ld-opt="-static-libgcc -lc -lcrypto -arch i386" --with-http_gzip_static_module --with-http_ssl_module --with-ipv6
    ./configure --with-pcre="../dependencies/pcre-$PCRE_VER" --with-pcre-opt="-arch i386" --with-zlib="../dependencies/zlib-$ZLIB_VER" --with-zlib-opt="-arch i386" --with-openssl="../dependencies/openssl-$OPENSSL_VER" --prefix="./nginx_data" --with-cc-opt="-DNGX_HAVE_ACCEPT4=0 -arch i386" --with-ld-opt="-lc -lcrypto -arch i386" --with-http_gzip_static_module --with-http_ssl_module --with-ipv6

else
    os_friendly_name='Linux'
   ./configure --with-pcre="../dependencies/pcre-$PCRE_VER" --with-zlib="../dependencies/zlib-$ZLIB_VER" --with-openssl="../dependencies/openssl-$OPENSSL_VER" --prefix="./nginx_data" --with-cc-opt="-DNGX_HAVE_ACCEPT4=0" --with-ld-opt="-static-libgcc -Wl,-Bstatic -lc" --with-http_gzip_static_module --with-http_ssl_module --with-ipv6
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