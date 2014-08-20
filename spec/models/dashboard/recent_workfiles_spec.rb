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

    FactoryGirl.create(:workfile)
  end

  it 'fetches the last X opened workfiles' do
    result.length.should == 5
  end

  it 'only fetches workfiles opened by the current user' do
    result.map { |o| o.workfile.id }.should == @ids.last(5)
  end
end
