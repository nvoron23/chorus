#!/bin/bash

# For IntelliJ IDEA 12, the following will yield "External Tools" to run jasmine within the IDE (or launch into a browser)
# On a mac with default install: $HOME/Library/Preferences/IntelliJIdea12/tools/jasmine.xml
#        <?xml version="1.0" encoding="UTF-8"?>
#        <toolSet name="jasmine">
#          <tool name="jasmine" description="Jasmine in chrome" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="false" showConsoleOnStdErr="false" synchronizeAfterRun="true">
#            <exec>
#              <option name="COMMAND" value="$USER_HOME$/alpine/chorus/script/launch_jasmine.sh" />
#              <option name="PARAMETERS" value="$FilePathRelativeToProjectRoot$" />
#              <option name="WORKING_DIRECTORY" value="$USER_HOME$/alpine/chorus" />
#            </exec>
#          </tool>
#          <tool name="jaz" description="Jasmine in console" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="false" showConsoleOnStdErr="false" synchronizeAfterRun="true">
#            <exec>
#              <option name="COMMAND" value="$USER_HOME$/alpine/chorus/script/launch_phantom.sh" />
#              <option name="PARAMETERS" value="$FilePathRelativeToProjectRoot$" />
#              <option name="WORKING_DIRECTORY" value="$USER_HOME$/alpine/chorus" />
#            </exec>
#          </tool>
#        </toolSet>

if [ -z "$1" ]; then
    echo "Opening $JASMINE_URL to run all the tests"
    open "$JASMINE_URL"
    exit 0
fi

# is this a spec file?
echo $1 | grep 'spec.js$'

if [ $? -eq 0 ]; then
  # ends with 'spec.js', probably a spec file
  SPECFILE=$1
else
  # inject _spec and find the file with the right name
  SPECFILE=$(script/find_spec_or_impl.rb $1)
  if [ -z "$SPECFILE" ]; then
    echo "Could not locate a spec file to go with $1" >&2
    exit 1
  fi

  echo "Detected $SPECFILE as matching spec for $1"
fi

DESCRIBE_LINE=$(grep describe $SPECFILE | head -n1)

if [ -z "$DESCRIBE_LINE" ]; then
    echo "This does not appear to be a spec file." >&2
    exit 1
fi

# to escape the single quotes in sed, you do: '\'' - escaping your single quotes, and wrapping that in single quotes
# see: http://muffinresearch.co.uk/archives/2007/01/30/bash-single-quotes-inside-of-single-quoted-strings/
SPEC=$(echo $DESCRIBE_LINE | sed 's/.*["'\'']\(.*\)["'\''][^"'\'']*$/\1/')

echo "Running $JASMINE_URL$SPEC in phantom"

# try to have the PATH variable in order before we run phantom
source ~/.bash_profile
if [[ $PATH != ?(*:)/usr/local/bin?(:*) ]]; then
    export PATH=$PATH:/usr/local/bin
fi

phantomjs spec/run-phantom-jasmine.js 8888 $SPEC
