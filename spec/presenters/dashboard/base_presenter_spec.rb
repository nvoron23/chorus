require 'spec_helper'

describe Dashboard::BasePresenter, :type => :view do
  before do
    set_current_user(user)
  end

  let(:user) { users(:admin) }
  let(:presenter) { described_class.new(model, view) }
  let(:hash) { presenter.to_hash }

  context 'for SiteSnapshot' do
    let(:model) { Dashboard::SiteSnapshot.new({}).fetch! }

    it 'hash should have attributes' do
      hash[:data].should == model.result
    end
  end

  context 'for RecentWorkfiles' do
    let(:model) { Dashboard::RecentWorkfiles.new(:user => user).fetch! }

    before do
      Workfile.last(3).each do |workfile|
        OpenWorkfileEvent.create!(user: user, workfile: workfile)
      end
    end

    it 'hash should have attributes' do
      hash[:data].should == model.result
    end
  end
end
