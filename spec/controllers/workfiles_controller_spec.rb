require 'spec_helper'

describe WorkfilesController do
  let(:user) { users(:owner) }
  let(:admin) { users(:admin) }
  let(:member) { users(:the_collaborator) }
  let(:non_member) { users(:no_collaborators) }
  let(:workspace) { workspaces(:public) }
  let(:private_workspace) { workspaces(:private) }
  let(:private_workfile) { workfiles(:private) }
  let(:public_workfile) { workfiles(:public) }
  let(:file) { test_file(file_name, "text/sql") }
  let(:file_name) { "workfile.sql" }

  before do
    log_in user
  end

  describe "#index" do
    it "responds with a success" do
      get :index, :workspace_id => workspace.id
      response.code.should == "200"
    end

    it "sorts by file name by default" do
      get :index, :workspace_id => workspace.id
      names = decoded_response.map { |file| file.name }
      names.should == names.sort
    end

    it "sorts by last updated " do
      get :index, :workspace_id => workspace.id, :order => "date"
      timestamps = decoded_response.map { |file| file.updated_at }
      timestamps.should == timestamps.sort
    end

    it "sorts by Workfile name " do
      get :index, :workspace_id => workspace.id, :order => "file_name"
      names = decoded_response.map { |file| file.name }
      names.should == names.sort
    end

    context "with a name pattern" do
      it "filters by name pattern" do
        get :index, :workspace_id => workspace.id, :name_pattern => "hadoop_dataset_fl"
        response.code.should == "200"
        decoded_response.length.should == 1
      end
    end

    context "with file types" do
      it "filters by file type: sql" do
        get :index, :workspace_id => workspace.id, :order => "file_name", :file_type => "sql"
        response.code.should == "200"
        decoded_response.map(&:file_type).uniq.should == ['sql']
      end

      it "filters by file type: code" do
        get :index, :workspace_id => workspace.id, :order => "file_name", :file_type => "code"
        response.code.should == "200"
        decoded_response.map(&:file_type).uniq.should == ['code']
      end

      it 'filters by file type: work_flow' do
        get :index, :workspace_id => workspace.id, :order => "file_name", :file_type => "work_flow"
        response.code.should == "200"
        decoded_response.map(&:file_type).uniq.should == ['work_flow']
      end

      it 'includes all types if file_type is nil or empty string' do
        get :index, :workspace_id => workspace.id, :order => 'file_name', :file_type => ''
        decoded_response.size.should > 0
        get :index, :workspace_id => workspace.id, :order => 'file_name', :file_type => nil
        decoded_response.size.should > 0
      end
    end

    describe "pagination" do
      let(:sorted_workfiles) { workspace.workfiles.sort_by! { |wf| wf.file_name.downcase } }

      it "defaults the per_page to fifty" do
        get :index, :workspace_id => workspace.id
        decoded_response.length.should == sorted_workfiles.length
        request.params[:per_page].should == 50
      end

      it "paginates the collection" do
        get :index, :workspace_id => workspace.id, :page => 1, :per_page => 2
        decoded_response.length.should == 2
      end

      it "defaults to page one" do
        get :index, :workspace_id => workspace.id, :per_page => 2
        decoded_response.length.should == 2
        decoded_response.first.id.should == sorted_workfiles.first.id
      end

      it "accepts a page parameter" do
        get :index, :workspace_id => workspace.id, :page => 2, :per_page => 2
        decoded_response.length.should == 2
        decoded_response.first.id.should == sorted_workfiles[2].id
        decoded_response.last.id.should == sorted_workfiles[3].id
      end
    end

    generate_fixture "workfileSet.json" do
      get :index, :workspace_id => workspace.id
    end

    generate_fixture "workFlowSet.json" do
      get :index, :workspace_id => workspace.id, :file_type => 'alpine'
    end
  end

  describe "#show" do
    context "for a private workspace" do
      context "as a workspace member" do
        before do
          private_workspace.members << member
          log_in member
        end

        it "responds with a success" do
          get :show, {:id => private_workfile}
          response.should be_success
        end

        it "presents the latest version of a workfile" do
          mock_present do |model, _, options|
            model.should == private_workfile
            options[:contents].should be_present
            options[:workfile_as_latest_version].should be_true
          end

          get :show, {:id => private_workfile}
        end
      end

      context "as a non-member" do
        it "responds with unsuccessful" do
          log_in non_member
          get :show, {:id => private_workfile}
          response.should_not be_success
        end
      end
    end

    context "for a public workspace" do
      before do
        log_in non_member
      end

      it "responds with a success" do
        get :show, {:id => public_workfile}
        response.should be_success
      end

      context "for an alpine workfile" do
        let(:alpine_workfile) { workfiles("alpine_flow") }

        before do
          alpine_workfile.execution_locations.first.should == databases(:default)
        end

        describe "connecting to the data source" do
          before do
            alpine_workfile.data_sources.first.accounts.create(:owner => user)
          end

          it "validates the datasource connections" do
            mock(controller).authorize!(:show, alpine_workfile.workspace)
            mock(controller).authorize!(:show_contents, alpine_workfile.data_sources.first)
            any_instance_of(AlpineWorkfile) do |workfile|
              mock(workfile).attempt_data_source_connection
            end

            get :show, {:id => alpine_workfile, :connect => true}
            response.should be_success
          end

          context "when the user does not have a credential mapping" do
            before do
              user.data_source_accounts.destroy_all
            end

            it "responds with 403, missing credentials" do
              get :show, {:id => alpine_workfile, :connect => true}
              response.should_not be_not_found
              response.should be_forbidden
            end
          end

          context "when the user has wrong credentials" do
            before do
              alpine_workfile.data_sources.first.accounts.create(:owner => user).invalid_credentials!
            end

            it "responds with 403, missing credentials" do
              get :show, {:id => alpine_workfile, :connect => true}
              response.should_not be_not_found
              response.should be_forbidden
            end
          end
        end

      end
    end

    describe "jasmine fixtures" do
      before do
        log_in admin
      end

      def self.generate_workfile_fixture(fixture_name, json_filename)
        generate_fixture "workfile/#{json_filename}" do
          fixture = workfiles(fixture_name)
          get :show, :id => fixture.id
        end
      end

      generate_workfile_fixture(:"sql.sql", "sql.json")
      generate_workfile_fixture(:"text.txt", "text.json")
      generate_workfile_fixture(:"image.png", "image.json")
      generate_workfile_fixture(:"binary.tar.gz", "binary.json")
      generate_workfile_fixture(:"tableau", "tableau.json")
      generate_workfile_fixture(:"alpine_flow", "alpine.json")
      generate_workfile_fixture(:"alpine_hadoop_dataset_flow", "alpineHdfsDatasetFlow.json")
      generate_workfile_fixture(:multiple_data_source_workflow, "alpineMultiDataSourceFlow.json")
    end

    it 'creates a workfile open event' do
      expect {
        get :show, :id => public_workfile
      }.to change(OpenWorkfileEvent, :count).by(1)
      OpenWorkfileEvent.last.user.id.should == user.id
      OpenWorkfileEvent.last.workfile.id.should == public_workfile.id
    end
  end

  describe "#create" do
    let(:params) do
      {
        :workspace_id => workspace.to_param,
        :workfile => {:description => "Nice workfile, good workfile, I've always wanted a workfile like you",
                      :versions_attributes => [{:contents => file}]}
      }
    end

    it_behaves_like "an action that requires authentication", :post, :create, :workspace_id => '-1'

    context "creating a new sql file" do
      let(:params) do
        {
          :workspace_id => workspace.to_param,
          :workfile => {:file_name => "new_file.sql"}
        }
      end

      it 'works' do
        post :create, params
        response.code.should == '201'
      end

      it 'throws errors on name conflicts' do
        FactoryGirl.create(:workfile, :workspace => workspace, :file_name => "new_file.sql")
        post :create, params
        response.code.should == '422'
      end
    end

    context "uploading a file" do
      it 'creates a workfile' do
        Workfile.last.file_name.should_not == 'workfile.sql'

        post :create, params
        response.code.should == "201"
        Workfile.last.file_name.should == 'workfile.sql'
      end

      it 'resolves name conflicts' do
        FactoryGirl.create(:workfile, :workspace => workspace, :file_name => file_name)
        post :create, params
        response.code.should == "201"
        Workfile.last.file_name.should == 'workfile_1.sql'
      end

      context 'when uploading a workfile with an invalid name' do
        let(:file) { test_file '@invalid' }

        it 'returns 422' do
          post :create, params
          response.code.should == '422'
        end
      end

      describe 'uploading a WorkFlow' do
        let(:description) { "Nice workfile, good workfile, I've always wanted a workfile like you" }
        let(:file) { test_file('workflow.afm', "text/xml") }
        let(:hdfs) { hdfs_data_sources(:hadoop) }
        let(:params) do
          {
            :workspace_id => workspace.to_param,
            :workfile => {
              :description => description,
              :entity_subtype => 'alpine',
              :versions_attributes => {"0" => {:contents => file}},
              :hdfs_data_source_id => hdfs.id,
              :database_id => ""
            }
          }
        end

        before do
          any_instance_of(Alpine::API) { |api|
            stub(api).session_id
            stub(api).create_work_flow
          }
        end

        it "creates a workflow 201" do
          Workfile.last.file_name.should_not == 'workflow'

          post :create, params
          response.code.should == "201"
          Workfile.last.file_name.should == 'workflow'
        end
      end
    end

    context 'creating a workfile from an svg document' do
      it 'works' do
        expect {
          post :create, :workspace_id => workspace.to_param, :workfile => {:file_name => 'some_vis.png', :svg_data => '<svg xmlns="http://www.w3.org/2000/svg"></svg>'}
        }.to change(Workfile, :count).by(1)
        Workfile.last.file_name.should == 'some_vis.png'
      end

      it 'resolves name conflicts' do
        FactoryGirl.create(:workfile, :workspace => workspace, :file_name => 'some_vis.png')
        post :create, :workspace_id => workspace.to_param, :workfile => {:file_name => 'some_vis.png', :svg_data => '<svg xmlns="http://www.w3.org/2000/svg"></svg>'}
        response.code.should == '201'
        Workfile.last.file_name.should == 'some_vis_1.png'
      end
    end

    context 'when entity_subtype is alpine' do
      context "and a database has been chosen" do
        let(:database) { databases(:default) }
        let(:params) do
          {
            :workspace_id => workspace.to_param,
            :workfile => {
              :file_name => 'something',
              :entity_subtype => 'alpine',
              :execution_locations => [
                {
                  :id => database.to_param,
                  :entity_type => 'gpdb_database'
                }
              ]
            }
          }
        end

        it 'creates an AlpineWorkfile' do
          mock_present do |model|
            model.reload
            model.should be_a AlpineWorkfile
            model.file_name.should == 'something'
            model.execution_locations.should =~ [database]
            model.workspace.should == workspace
          end
          post :create, params
        end
      end

      context "and an hdfs data source has been chosen" do
        let(:hdfs_data_source) { hdfs_data_sources(:hadoop) }
        let(:params) do
          {
            :workspace_id => workspace.to_param,
            :workfile => {
              :entity_subtype => 'alpine',
              :file_name => 'something',
              :execution_locations => [
                {
                  :id => hdfs_data_source.id,
                  :entity_type => 'hdfs_data_source'
                }
              ]
            }
          }
        end

        it 'creates an AlpineWorkfile' do
          mock_present do |model|
            model.reload
            model.should be_a AlpineWorkfile
            model.file_name.should == 'something'
            model.execution_locations.should =~ [hdfs_data_source]
            model.workspace.should == workspace
          end
          post :create, params
        end
      end

      context "and an oracle data source has been chosen" do
        let(:oracle_data_source) { data_sources(:oracle) }
        let(:params) do
          {
            :workspace_id => workspace.to_param,
            :workfile => {
              :entity_subtype => 'alpine',
              :file_name => 'something',
              :execution_locations => [
                {
                  :id => oracle_data_source.id,
                  :entity_type => 'oracle_data_source'
                }
              ]
            }
          }
        end

        it 'creates an AlpineWorkfile' do
          mock_present do |model|
            model.reload
            model.should be_a AlpineWorkfile
            model.file_name.should == 'something'
            model.execution_locations.should =~ [oracle_data_source]
            model.workspace.should == workspace
          end
          post :create, params
        end
      end

      context "and an invalid data source has been chosen" do
        let(:params) do
          {
            :workspace_id => workspace.to_param,
            :workfile => {
              :entity_subtype => 'alpine',
              :file_name => 'something',
              :execution_locations => [
                {
                  :id => 12345,
                  :entity_type => 'sandwich'
                }
              ]
            }
          }
        end

        it 'raises an error' do
          post :create, params
          response.should be_unprocessable
        end
      end

      context "and a list of datasets have been chosen" do
        let(:dataset_ids) { [datasets(:table).id, datasets(:other_table).id].map(&:to_s) }
        let(:params) do
          {
            :workspace_id => workspace.to_param,
            :workfile => {
              :entity_subtype => 'alpine',
              :file_name => 'something',
              :dataset_ids => dataset_ids
            }
          }
        end

        it 'creates an AlpineWorkfile' do
          mock_present do |model|
            model.should be_a AlpineWorkfile
            model.file_name.should == 'something'
            model.execution_locations.should =~ [datasets(:table).database]
            model.additional_data['dataset_ids'].should =~ dataset_ids
            model.workspace.should == workspace
          end
          post :create, params
        end
      end

      context "and a list of HdfsDatasets has been chosen" do
        let(:workspace_id) { dataset.workspace_id }
        let(:hdfs_data_source) { dataset.hdfs_data_source }
        let(:dataset) { datasets(:hadoop) }
        let(:another_dataset) { FactoryGirl.create(:hdfs_dataset, :hdfs_data_source => dataset.execution_location) }
        let(:dataset_ids) { [dataset.id.to_s, another_dataset.id.to_s] }

        let(:params) do
          {
            :workfile => {
              :workspace => {
                :id => workspace_id
              },
              :entity_subtype => "alpine",
              :file_name => 'analytical-derivations',
              :dataset_ids => dataset_ids
            },
            :workspace_id => workspace_id
          }
        end

        it 'creates an AlpineWorkfile' do
          mock_present do |model|
            model.should be_a AlpineWorkfile
            model.file_name.should == 'analytical-derivations'
            model.execution_locations.should =~ [hdfs_data_source]
            model.additional_data['dataset_ids'].should =~ dataset_ids
            model.workspace.should == workspace
          end
          post :create, params
        end
      end

      context "and a oracle dataset has been chosen" do
        let(:dataset) { datasets(:oracle_table) }
        let(:dataset_ids) { [dataset.id.to_s] }
        let(:oracle_data_source) { dataset.data_source }
        let(:params) do
          {
            :workfile => {
              :workspace => {
                :id => workspace.id
              },
              :entity_subtype => "alpine",
              :file_name => 'reticulated-splines',
              :dataset_ids => dataset_ids
            },
            :workspace_id => workspace.id
          }
        end

        before do
          workspace.associate_datasets(user, [dataset])
        end

        it 'creates an AlpineWorkfile' do
          mock_present do |model|
            model.should be_a AlpineWorkfile
            model.file_name.should == 'reticulated-splines'
            model.execution_locations.should =~ [oracle_data_source]
            model.additional_data['dataset_ids'].should =~ dataset_ids
            model.workspace.should == workspace
          end
          post :create, params
        end
      end
    end

  end

  describe "#update" do
    let(:schema) { schemas(:public) }
    let(:options) do
      {
        :id => public_workfile.to_param,
        :workfile => {
          :execution_schema => {:id => schema.to_param}
        }
      }
    end

    it "uses authorization" do
      mock(controller).authorize!(:can_edit_sub_objects, public_workfile.workspace)
      put :update, options
    end

    it "updates the schema of workfile" do
      put :update, options
      response.should be_success
      decoded_response[:execution_schema][:id].should == schema.id
      public_workfile.reload.execution_schema.should == schema
    end

    context 'when the schema is postgres' do
      let(:schema) { schemas(:pg) }
      it 'updates the schema of workfile' do
        put :update, options
        response.should be_success
        decoded_response[:execution_schema][:id].should == schema.id
        public_workfile.reload.execution_schema.should == schema
      end
    end

    context 'when the schema cannot be a sandbox' do
      let(:schema) { schemas(:oracle) }

      it 'updates the schema of workfile' do
        put :update, options
        response.should be_success
        decoded_response[:execution_schema][:id].should == schema.id
        public_workfile.reload.execution_schema.should == schema
      end
    end

    describe "updating file names" do
      let(:new_name) { "new_name.sql" }
      let(:workfile) { public_workfile }
      let(:options) do
        {
          :id => workfile.to_param,
          :workfile => {
            :file_name => new_name
          }
        }
      end

      it "updates the file name" do
        put :update, options
        response.should be_success
        workfile.reload.file_name.should == new_name
      end

      context "when the filename is not provided" do
        let(:options) { {:id => public_workfile.to_param} }

        it "leaves the filename alone" do
          old_filename = public_workfile.file_name
          put :update, options
          response.should be_success
          public_workfile.reload.file_name.should == old_filename
        end
      end

      context "when the filename is already taken" do
        let(:new_name) { workfiles(:tableau).file_name }

        it "responds with a validation error" do
          put :update, options
          response.code.should == '422'
        end
      end

      context "when the user has appended .SQL" do
        let(:new_name) { "yo.sql" }
        let(:workfile) { workfiles("text.txt") }

        it "turns into a SQLWorkfile" do
          put :update, options
          response.should be_success
          workfile.reload.content_type.should == "sql"
        end
      end
    end

    context "when no execution schema has been set" do
      let(:options) do
        {
          :id => public_workfile.to_param
        }
      end

      it "does not throw an error" do
        put :update, options
        response.should be_success
      end
    end

    context "as a user who is not a workspace member" do
      let(:user) { users(:not_a_member) }
      let(:schema) { schemas(:other_schema) }
      let(:options) do
        {
          :id => private_workfile.to_param,
          :execution_schema_id => schema.to_param
        }
      end

      it "does not allow updating the workfile" do
        put :update, options
        response.should be_forbidden
        private_workfile.reload.execution_schema.should_not == schema
      end
    end

    context "for alpine workfiles" do
      let(:workfile) { workfiles(:'alpine_flow') }
      let(:params) do
        {
          :entity_subtype => 'alpine',
          :file_name => 'something',
          :database_id => databases(:alternate).to_param,
          :id => workfile.to_param
        }
      end

      it "updates the model successfully" do
        put :update, params
        response.should be_success
        workfile.reload.file_name.should == 'something'
      end

      context "and a database has been chosen" do
        let(:database) { databases(:alternate) }
        let(:params) do
          {
            :id => workfile.to_param,
            :workfile => {
              :entity_subtype => 'alpine',
              :file_name => 'something',
              :execution_locations => [
                {
                  :entity_type => 'gpdb_database',
                  :id => database.id
                }
              ]
            }
          }
        end

        it 'updates an AlpineWorkfile' do
          mock_present do |model|
            model.should be_a AlpineWorkfile
            model.file_name.should == 'something'
            model.execution_locations.should == [database]
            model.workspace.should == workspace
          end
          put :update, params
        end
      end

      context "and an hdfs data source has been chosen" do
        let(:hdfs_data_source) { hdfs_data_sources(:hdfs_data_source44445) }
        let(:params) do
          {
            :id => workfile.to_param,
            :workfile => {
              :entity_subtype => 'alpine',
              :file_name => 'something',
              :execution_locations => [
                {
                  :entity_type => 'hdfs_data_source',
                  :id => hdfs_data_source.id
                }
              ]
            }
          }
        end

        it 'updates an AlpineWorkfile' do
          mock_present do |model|
            model.should be_a AlpineWorkfile
            model.file_name.should == 'something'
            model.execution_locations.should == [hdfs_data_source]
            model.workspace.should == workspace
          end
          put :update, params
        end
      end
    end
  end

  describe "#destroy" do
    before do
      workspace.members << member
      log_in member
    end

    it "uses authorization" do
      mock(subject).authorize! :can_edit_sub_objects, workspace
      delete :destroy, :id => public_workfile.id
    end

    describe "deleting" do
      before do
        delete :destroy, :id => public_workfile.id
      end

      it "should soft delete the workfile" do
        workfile = Workfile.find_with_destroyed(public_workfile.id)
        workfile.deleted_at.should_not be_nil
      end

      it "should respond with success" do
        response.should be_success
      end

      it "should delete related OpenWorkfileEvent records" do
        OpenWorkfileEvent.where(:workfile_id => public_workfile.id, :user_id => user.id).count.should == 0
      end
    end
  end

  describe 'destroy_multiple' do
    before do
      workspace.members << member
      log_in member
    end

    it 'uses authorization' do
      mock(subject).authorize! :can_edit_sub_objects, workspace
      delete :destroy_multiple, :workspace_id => workspace.id
    end

    it 'deletes multiple associations' do
      workspace.workfiles.count.should > 0
      delete :destroy_multiple, :workspace_id => workspace.id, :workfile_ids => workspace.workfiles.map(&:id)
      response.code.should == '200'

      workspace.workfiles.reload.count.should == 0
      OpenWorkfileEvent.where(:workfile_id => workspace.workfiles.map(&:id), :user_id => user.id).count.should == 0

    end

    it 'preserves existing associations' do
      workfile_ids = workspace.workfiles.map(&:id)
      delete :destroy_multiple, :workspace_id => workspace.id, :workfile_ids => workfile_ids.first(2)
      response.code.should == '200'

      workspace.workfiles.reload.count.should == workfile_ids.count - 2
    end
  end

  describe '#run' do
    let(:workfile) { workfiles(:alpine_flow) }
    let(:run_process_id) { 'fakeprocessid' }

    before do
      mock(Alpine::API).run_work_flow.with_any_args { run_process_id }
    end

    it 'uses authorization and runs the workflow' do
      mock(controller).authorize!(:can_edit_sub_objects, workfile.workspace)
      post :run, :id => workfile.id
    end

    context 'when the workfile starts running successfully' do
      it 'returns a 202' do
        post :run, :id => workfile.id
        response.code.should == '202'
      end

      it 'presents the workflow' do
        post :run, :id => workfile.id
        decoded_response[:status].should == AlpineWorkfile::RUNNING
      end
    end

    context 'when the workfile does not start running successfully' do
      let(:run_process_id) { raise Alpine::API::RunError }

      it 'returns 422' do
        post :run, :id => workfile.id
        response.should be_unprocessable
        decoded_errors.record.should == 'RUN_FAILED'
      end
    end
  end

  describe '#stop' do
    let(:workfile) { workfiles(:alpine_flow) }

    before do
      mock(Alpine::API).stop_work_flow.with_any_args { OpenStruct.new({code: '200'}) }
    end

    it 'uses authorization and stops the workflow' do
      mock(controller).authorize!(:can_edit_sub_objects, workfile.workspace)
      post :stop, :id => workfile.id
    end

    it 'returns a 202' do
      post :stop, :id => workfile.id
      response.code.should == '202'
    end

    it 'presents the workflow' do
      post :stop, :id => workfile.id
      decoded_response[:status].should == AlpineWorkfile::IDLE
    end
  end
end
