require 'spec_helper'

describe Dashboard::RecentWorkfiles do

  let(:user) { users(:the_collaborator) }
  let(:other_user) { users(:owner) }
  let(:result) { described_class.new({:user => user}).fetch!.result }

  before do
    @ids = []
    Workfile.last(6).each do |workfile|
      OpenWorkfileEvent.create!(user: user, workfile: workfile)
      @ids << workfile.id
    end

    last_workfile = Workfile.first
    OpenWorkfileEvent.create!(user: other_user, workfile: last_workfile)
    user.dashboard_items.create!(:name => 'RecentWorkfiles', :location => 1)

    FactoryGirl.create(:workfile)
  end

  it 'fetches the last 5 opened workfiles' do
    result.length.should == 5
  end

  it 'only fetches workfiles opened by the current user' do
    result.map { |o| o.workfile.id }.should == @ids.reverse.first(5)
  end

  describe 'when the limit value changes' do

    before do
      user.dashboard_items.where(:name => 'RecentWorkfiles').update_all(:options => 6)
    end

    it 'fetches the last 6 opened workfiles' do
      result.length.should == 6
    end

    it 'only fetches workfiles opened by the current user' do
      result.map { |o| o.workfile.id }.should == @ids.reverse.first(6)
    end
  end
end
