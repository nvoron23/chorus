require 'spec_helper'

describe Dashboards::RecentWorkfilesController do
  let(:user) { users(:owner) }

  before do
    log_in user
    user.dashboard_items.create!(:name => 'RecentWorkfiles', :location => 1)
    Workfile.last(6).each do |workfile|
      OpenWorkfileEvent.create!(user: user, workfile: workfile)
    end
  end

  describe '#create' do
    context 'updating the option' do
      let(:params) do
        {
            :recent_workfiles => {
                :action => 'updateOption',
                :option_value => '6'
            }
        }
      end
      it 'updates the option parameter' do
        post :create, params
      end
    end

    context 'clearing the recent workfiles list' do
      let(:params) do
        {
            :recent_workfiles => {
                :action => 'clearList',
            }
        }
      end
      it 'updates the option parameter' do
        user.dashboard_items.where(:name => 'RecentWorkfiles').update_all(:options => 6)
        recent_workfile = Dashboard::RecentWorkfiles.new({:user => user})
        recent_workfile.fetch!.result.length.should == 6
        post :create, params
        recent_workfile.fetch!.result.length.should == 0
      end
    end

  end
end
