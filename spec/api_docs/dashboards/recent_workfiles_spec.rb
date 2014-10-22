require 'spec_helper'

resource 'Dashboard' do
  let(:user) { users(:admin) }

  before do
    log_in user
  end

  post '/dashboards/recent_workfiles' do

    parameter :action, 'The action you want to take for Recent Workfiles<br><br>
                          - "updateOption": Updates the number of recent workfiles to display (requires "option_value" parameter)
                          - "clearList": Clears list of recent workfiles for user'
    parameter :option_value, 'For "updateOption", the number of recent workfiles to display in the module'
    required_parameters :action

    let(:action) { 'updateOption' }
    let(:option_value) { '5' }

    example_request 'Update the state of Recent Workfiles module' do
      status.should == 200
    end
  end
end
