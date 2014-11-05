#!/usr/bin/env bash

POSTGRES_VERSION="9.2.9"

wget http://ftp.postgresql.org/pub/source/v$POSTGRES_VERSION/postgresql-$POSTGRES_VERSION.tar.gz
tar xzf postgresql-$POSTGRES_VERSION.tar.gz
cd postgresql-$POSTGRES_VERSION

rm -rf /tmp/postgres

# We need this setup so library path is searched at runtime based on the bin path (relocatable installation)
./configure LDFLAGS='-Wl,-rpath,'\''$$ORIGIN'\''/../lib'  --disable-rpath --prefix=/tmp/postgres --without-zlib --without-readline

make && make install

pushd /tmp

echo "Packaging postgres-$POSTGRES_VERSION.tar.gz.."
tar czfh postgres-$POSTGRES_VERSION.tar.gz postgres/

echo "Moving package to $CHORUS_HOME/packaging/postgres/.."

popd

cd ..
mv /tmp/postgres-$POSTGRES_VERSION.tar.gz postgres/

echo "Removing temp files.."
rm postgresql-$POSTGRES_VERSION.tar.gz
rm -rf postgresql-$POSTGRES_VERSION

echo "Postgres installation complete."
