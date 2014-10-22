require 'spec_helper'

describe WorkfileUpgradedVersionPresenter, :type => :view do
  let(:current_user) { users(:owner) }
  before { set_current_user(current_user) }

  let(:event) { Events::WorkfileUpgradedVersion.first }
  subject { WorkfileUpgradedVersionPresenter.present event, view, options }
  let(:options) { {} }
  let(:hash) { subject.to_hash }
  let(:workfile_hash) { Presenter.present(event.workfile, view, sub_presenter_options.merge(:workfile_as_latest_version => true)).to_hash }
  let(:workspace_hash) { Presenter.present(event.workspace, view, sub_presenter_options).to_hash }
  let(:sub_presenter_options) { {:succinct => true, :activity_stream => true} }

  it 'includes all the relevant fields' do
    hash[:workfile].should == workfile_hash
    hash[:workspace].should == workspace_hash

    hash[:commit_message].should == event.commit_message
    hash[:version_num].should == event.version_num
    hash[:version_id].should == event.version_id
    hash[:version_is_deleted].should == false

    hash[:actor].should == UserPresenter.new(event.actor, view, sub_presenter_options).presentation_hash
    hash[:timestamp].should == event.created_at
  end

  context 'when the version is deleted' do
    before { WorkfileVersion.find(event.version_id).destroy }

    it 'presents a truthy version_is_deleted flag' do
      hash[:version_is_deleted].should == true
    end
  end
end