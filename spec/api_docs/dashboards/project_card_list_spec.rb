require 'spec_helper'

resource 'Dashboard' do
  let(:user) { users(:admin) }

  before do
    log_in user
  end

  get '/dashboards/project_card_list' do
    example_request 'Get the Project Card List option value' do
      status.should == 200
    end
  end

  post '/dashboards/project_card_list' do

    parameter :option_value, 'The last setting that the user chose for displaying workspaces/project cards ("all", "members_only", or "most_active")'
    required_parameters :option_value

    let(:option_value) { 'all' }

    example_request 'Update the state of Project Card List module' do
      status.should == 200
    end
  end
end
