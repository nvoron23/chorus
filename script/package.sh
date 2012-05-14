#!/bin/bash

RUBY_URL="http://ftp.ruby-lang.org/pub/ruby/1.9/ruby-1.9.3-p125.tar.gz"
RBENV_URL="git://github.com/sstephenson/rbenv.git"

HADOOP_URL1="http://www.reverse.net/pub/apache/hadoop/common/hadoop-1.0.0/hadoop-1.0.0.tar.gz"
HADOOP_URL2="http://apache.spinellicreations.com/hadoop/common/hadoop-0.20.205.0/hadoop-0.20.205.0.tar.gz"
HADOOP_URL3="http://archive.apache.org/dist/hadoop/core/hadoop-0.20.1/hadoop-0.20.1.tar.gz"

####################################################################
####################################################################

# WARNING: We assume that git and gcc are installed


function resolve_path {
    RESOLVED_PATH="$( cd "$1" && pwd )"
}

# $1: url
# $2: local filename
# $3: target path
function download {
    if [ -a "$3/$2" ]; then 
        echo "Download exists: $2"
    else
        echo "Downloading $2 from $1"
        curl "$1" >> "$2"
        mv "$2" "$3"
    fi
}

# $1: url
# $2: local folder name
# $3: target path
function git_clone {
    if [ -d "$3/$2" ]; then 
        echo "Directory exists: $3/$2"
    else
        git clone $1 "$3/$2"
    fi
}

####################################################################
####################################################################

# Paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

resolve_path "$SCRIPT_DIR/.."
DIR=$RESOLVED_PATH

PACKAGE_NAME="chorusrails-packages"
resolve_path "$DIR/../$PACKAGE_NAME"
PACKAGE_DIR="$RESOLVED_PATH"

HADOOP_DIR="$PACKAGE_DIR/hadoop"

DATE="$( date "+%Y-%m-%d-%H%M%S" )"

####################################################################
####################################################################

# Gems
bundle package

# Tar up the app
mkdir -p $PACKAGE_DIR

resolve_path "$DIR/../chorusrails"
tar -cf "$PACKAGE_DIR/app.tar" "$RESOLVED_PATH"

# Download and tar up ruby and rbenv
RUBY_SRC="ruby-src.tar.gz"
download $RUBY_URL $RUBY_SRC $PACKAGE_DIR
git_clone $RBENV_URL "rbenv" $PACKAGE_DIR

# Download and tar up Postgres

# Download and tar up imagemagick

# Tar up Hadoop vendor jars
download $HADOOP_URL1 "hadoop-1.0.0.tar.gz" $HADOOP_DIR
download $HADOOP_URL2 "hadoop-0.20.205.0.tar.gz" $HADOOP_DIR
download $HADOOP_URL3 "hadoop-0.20.1.tar.gz" $HADOOP_DIR

# Tar up everything into a huge bundle
TARGET_NAME="$PACKAGE_DIR/chorus-rails-$DATE.tar"
echo "Creating target package: $TARGET_NAME"
tar -cf $TARGET_NAME $PACKAGE_DIR/rbenv $PACKAGE_DIR/app.tar $PACKAGE_DIR/$RUBY_SRC
rm $PACKAGE_DIR/app.tar
