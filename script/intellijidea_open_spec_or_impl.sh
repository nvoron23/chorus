#!/bin/bash

# For IntelliJ IDEA 12, the following will yield "External Tools" to quickly swap between a source file and its corresponding test.
# On a mac with default install: $HOME/Library/Preferences/IntelliJIdea12/tools/Tools.xml
#        <?xml version="1.0" encoding="UTF-8"?>
#        <toolSet name="Tools">
#          <tool name="SourceSpecSwap" description="Command Shift T Swapping" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="false" showConsoleOnStdErr="false" synchronizeAfterRun="true">
#            <exec>
#              <option name="COMMAND" value="$USER_HOME$/alpine/chorus/script/intellijidea_open_spec_or_impl.sh" />
#              <option name="PARAMETERS" value="$FilePathRelativeToProjectRoot$" />
#              <option name="WORKING_DIRECTORY" value="$USER_HOME$/alpine/chorus" />
#            </exec>
#          </tool>
#        </toolSet>

if [ -z "$1" ]; then
    echo "This script must be called with an argument" >&2
    exit 1
fi

# Use Tools -> Create Command-Line Launcher
/usr/local/bin/idea $(script/find_spec_or_impl.rb $1)