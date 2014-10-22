require 'spec_helper'

describe WorkspacePresenter, :type => :view do
  let(:user) { users(:owner) }
  let(:archiver) { users(:the_collaborator) }
  let(:schema) { schemas(:default) }
  let(:workspace) { FactoryGirl.build :workspace, :owner => user, :archiver => archiver, :sandbox => schema }
  let(:presenter) { WorkspacePresenter.new(workspace, view, options) }

  before(:each) do
    set_current_user(user)
  end

  let(:options) { {} }

  describe "#to_hash" do
    let(:hash) { presenter.to_hash }

    it "includes the right keys" do
      keys = [
          :id, :name, :is_deleted, :entity_type, :summary, :archived_at, :permission, :public, :datasets_count,
          :members_count, :workfiles_count, :insights_count, :recent_insights_count, :recent_comments_count,
          :archiver, :image, :permission, :has_added_member, :has_added_workfile, :has_added_sandbox,
          :has_changed_settings, :tags, :sandbox_info, :show_sandbox_datasets,
          :owner, :is_member, :is_project, :project_status, :project_status_reason,
          :milestone_count, :milestone_completed_count, :project_target_date
      ]

      keys.each { |key| hash.should have_key(key) }
      hash.should_not have_key(:number_of_insights)
      hash.should_not have_key(:number_of_comments)
      hash.should_not have_key(:latest_comment_list)
    end

    it "uses the image presenter to serialize the image urls" do
      hash[:image].to_hash.should == (ImagePresenter.new(workspace.image, view).presentation_hash)
    end

    it "should respond with the current user's permissions (as an owner of the workspace)'" do
      hash[:permission].should == [:admin]
    end

    it 'should use UserPresenter presentation_hash method for owner' do
      new_owner = hash[:owner]
      new_owner.to_hash.should == (UserPresenter.new(user, view).presentation_hash)
    end

    it 'should use UserPresenter presentation_hash method for archiver' do
      new_archiver = hash[:archiver]
      new_archiver.to_hash.should == (UserPresenter.new(archiver, view).presentation_hash)
    end

    it "should use gpdbSchemaPresenter Hash method for sandbox_info" do
      new_sandbox = hash[:sandbox_info]
      new_sandbox.to_hash.should == (GpdbSchemaPresenter.new(schema, view, {:succinct => true}).presentation_hash)
    end

    it "sanitizes summary" do
      workspace.summary = "<script>alert('got your cookie')</script>"
      hash[:summary].should_not match "<"
    end

    context "when the workspace has tags" do
      let(:workspace) { workspaces(:tagged) }

      it 'includes the tags' do
        hash[:tags].count.should be > 0
        hash[:tags].should == Presenter.present(workspace.tags, @view)
      end
    end

    context "when the workspace has a status change event" do
      let(:workspace) { workspaces(:project) }

      it "includes the status change event" do
        presented_status_change = hash[:latest_status_change_activity]
        presented_status_change[:workspace][:id].should == workspace.id
        presented_status_change[:status].should == workspace.project_status
        presented_status_change[:reason].should == workspace.project_status_reason
      end
    end

    context "when rendering latest comments" do
      # Make sure succinct doesn't break show_latest_comments
      let(:options) { {:succinct => true, :show_latest_comments => true} }

      before do
        workspace.save!
      end

      it "should render the latest comment hash" do
        hash.should have_key(:number_of_insights)
        hash.should have_key(:number_of_comments)
        hash.should have_key(:latest_comment_list)
        hash.should have_key(:latest_insight)
      end

      context "with recent comments and insights" do
        let(:event) do
          evt = nil
          Timecop.freeze(8.days.ago) do
            evt = Events::NoteOnWorkspace.create!({:note_target => workspace, :body => 'event body'}, :as => :create)
          end
          evt
        end

        before do
          Timecop.freeze(1.day.ago) do
            @comment = Comment.create!(:body => 'comment body of event', :author_id => user.id, :event_id => event.id)
          end
          Timecop.freeze(1.minute.ago) do
            insight = Events::NoteOnWorkspace.create!({:note_target => workspace, :body => 'insight body', :insight => true}, :as => :create)
            Comment.create!(:body => 'comment body of insight', :author_id => user.id, :event_id => insight.id)
            Comment.create!(:body => 'comment body of insight 2', :author_id => user.id, :event_id => insight.id)
            @event_to_be_promoted = Events::NoteOnWorkspace.create!({:note_target => workspace, :body => 'event body -1'}, :as => :create)
            Events::NoteOnWorkspace.create!({:note_target => workspace, :body => 'event body -2'}, :as => :create)
          end
          @event_to_be_promoted.insight = true
          @event_to_be_promoted.save!
        end

        it "should have the correct values for latest comments/insights" do
          hash[:number_of_comments].should == 4
          hash[:number_of_insights].should == 2
          hash[:latest_comment_list].size.should == 5
          comment_ids = hash[:latest_comment_list].map { |comment| comment[:id] }
          comment_ids.should_not include(presenter.present(event)[:id])
          comment_ids.should_not include(presenter.present(@comment)[:id])
          hash[:latest_insight][:id].should == @event_to_be_promoted.id
        end

        it "uses updated_at timestamp to sort" do
          hash[:latest_comment_list][4][:id].should == presenter.present(@event_to_be_promoted)[:id]
        end
      end
    end

    context "when succinct is true" do
      let(:options) { {:succinct => true} }

      it "should only present enough for the dashboard list" do
        presenter.presentation_hash.keys.sort.should =~ [
            :id,
            :name,
            :entity_type,
            :is_deleted,
            :summary,
            :archived_at,
            :permission,
            :public,
            :datasets_count,
            :members_count,
            :workfiles_count,
            :insights_count,
            :recent_insights_count,
            :recent_comments_count,
            :has_recent_comments,
            :has_milestones,
            :owner,
            :is_project,
            :is_member,
            :project_status,
            :project_status_reason,
            :milestone_count,
            :milestone_completed_count,
            :project_target_date
        ]
      end

      describe 'project target date' do
        let(:workspace) { workspaces(:project) }

        it "displays in ISO8601 format" do
          hash[:project_target_date].should == workspace.project_target_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        end
      end
    end

    context 'when activity_stream is true' do
      let(:options) { {:activity_stream => true} }

      it 'does not include owner, latest comments, and project info' do
        hash.should_not have_key(:owner)

        hash.should_not have_key(:number_of_insights)
        hash.should_not have_key(:number_of_comments)
        hash.should_not have_key(:latest_comment_list)
        hash.should_not have_key(:latest_insight)

        hash.should_not have_key(:is_member)
        hash.should_not have_key(:is_project)
        hash.should_not have_key(:project_status)
        hash.should_not have_key(:project_status_reason)
        hash.should_not have_key(:milestone_count)
        hash.should_not have_key(:milestone_completed_count)
        hash.should_not have_key(:project_target_date)
        hash.should_not have_key(:latest_status_change_activity)
        hash.should_not have_key(:latest_status_change_activity)
      end
    end
  end

  describe "complete_json?" do
    it "is true" do
      presenter.presentation_hash[:complete_json].should be_true
    end

    context "when succinct is true" do
      let(:options) { {:succinct => true} }

      it "is false" do
        presenter.presentation_hash[:complete_json].should be_false
      end
    end

    context 'when activity_stream is true' do
      let(:options) { {:activity_stream => true} }

      it 'is false' do
        presenter.presentation_hash[:complete_json].should be_false
      end
    end
  end
end
