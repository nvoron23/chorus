require 'will_paginate/array'

class WorkfilesController < ApplicationController
  wrap_parameters :workfile
  include DataSourceAuth

  before_filter :convert_form_encoded_arrays, :only => [:create, :update]
  before_filter :authorize_edit_workfile, :only => [:update, :destroy,  :run, :stop]

  def index
    authorize! :show, workspace

    workfiles = workspace.filtered_workfiles(params)

    present paginate(workfiles), :presenter_options => {:workfile_as_latest_version => true, :list_view => true}
  end

  def show
    authorize! :show, workfile.workspace

    if params[:connect].present?
      authorize_data_sources_access workfile
      workfile.attempt_data_source_connection
    end

    log_workfile_opened_event(workfile, current_user)

    present workfile, :presenter_options => {:contents => true, :workfile_as_latest_version => true}
  end

  def create
    authorize! :can_edit_sub_objects, workspace

    workfile = Workfile.build_for(params[:workfile].merge(:workspace => workspace, :owner => current_user))
    workfile.update_from_params!(params[:workfile])

    present workfile, presenter_options: {:workfile_as_latest_version => true}, status: :created
  end

  def update
    execution_schema = params[:workfile][:execution_schema]

    if execution_schema && execution_schema[:id]
      schema = Schema.find(execution_schema[:id])
      params[:workfile][:execution_schema] = schema
    end

    workfile.assign_attributes(params[:workfile])
    workfile.update_from_params!(params[:workfile])

    present workfile, :presenter_options => {:include_execution_schema => true}
  end

  def destroy
    OpenWorkfileEvent.where(:workfile_id => workfile.id, :user_id => current_user).destroy_all
    workfile.destroy
    render :json => {}
  end

  def destroy_multiple
    authorize! :can_edit_sub_objects, workspace
    OpenWorkfileEvent.where(:workfile_id => params[:workfile_ids], :user_id => current_user).destroy_all
    workfiles = workspace.workfiles.where(:id => params[:workfile_ids])
    workfiles.destroy_all

    render :json => {}
  end

  def run
    workfile.run_now(current_user)

    present workfile, :status => :accepted
  rescue Alpine::API::RunError
    render_run_failed
  end

  def stop
    workfile.stop_now(current_user)
    present workfile, :status => :accepted
  end

  private

  def workfile
    @workfile ||= Workfile.find(params[:id])
  end

  def workspace
    @workspace ||= Workspace.find(params[:workspace_id])
  end

  def authorize_edit_workfile
    authorize! :can_edit_sub_objects, workfile.workspace
  end

  def convert_form_encoded_arrays
    # Sometimes (usually in areas that upload files via real form submission) the javascript app needs to send things in a form-encoded way,
    # which means arrays look like this:  {"0" => {"stuff" => "things"}, "1" => {"stuff" => "things"}}
    # This before_filter turns those params into regular arrays so that the rest of the code can treat them uniformly.
    [:execution_locations, :versions_attributes].each do |key|
      params[:workfile][key] = params[:workfile][key].values if params[:workfile][key] && params[:workfile][key].is_a?(Hash)
    end
  end

  def render_run_failed
    present_errors({:record => :RUN_FAILED}, :status => :unprocessable_entity)
  end

  def log_workfile_opened_event(workfile, user)
    OpenWorkfileEvent.create!(:workfile => workfile, :user => user)
  end
end
