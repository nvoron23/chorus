class WorkspacesController < ApplicationController
  wrap_parameters :exclude => []

  before_filter :demo_mode_filter, :only => [:create, :destroy]

  def index
    if params[:user_id]
      user = User.find(params[:user_id])
      workspaces = user.workspaces.workspaces_for(current_user)
    else
      workspaces = Workspace.workspaces_for(current_user)
    end

    workspaces = workspaces.active if params[:active]
    succinct = params[:succinct] == 'true'

    if params[:get_options] == 'most_active'
      available_workspaces = workspaces.select('*').map(&:id)
      top_workspace_ids = Events::Base.select('workspace_id, count(*) as event_count').group(:workspace_id).where('workspace_id IN (' + available_workspaces.join(',') + ')').order('event_count desc').limit(10).map(&:workspace_id)
      present paginate(workspaces.select('*').where('id IN (' + top_workspace_ids.join(',') + ')').includes(succinct ? [:owner] : Workspace.eager_load_associations).order("lower(name) ASC, id")),
          :presenter_options => {:show_latest_comments => params[:show_latest_comments] == 'true', :succinct => succinct}
    else
      present paginate(workspaces.includes(succinct ? [:owner] : Workspace.eager_load_associations).order("lower(name) ASC, id")),
              :presenter_options => {:show_latest_comments => params[:show_latest_comments] == 'true', :succinct => succinct}
    end
  end

  def create
    workspace = Workspace.create_for_user(current_user, params[:workspace])
    present workspace, :status => :created
  end


  def show
    workspace = Workspace.find(params[:id])
    authorize! :show, workspace
    present workspace, :presenter_options => {:show_latest_comments => params[:show_latest_comments] == 'true'}
  end

  def update
    workspace = Workspace.find(params[:id])

    attributes = params[:workspace]
    attributes[:archiver] = current_user if (attributes[:archived] && !workspace.archived?)
    workspace.attributes = attributes

    authorize! :update, workspace

    create_workspace_events(workspace) if workspace.valid?

    workspace.save!
    present workspace
  end

  def destroy
    workspace = Workspace.find(params[:id])
    authorize!(:destroy, workspace)
    Events::WorkspaceDeleted.by(current_user).add(:workspace => workspace)
    workspace.destroy

    render :json => {}
  end

  private

  def create_workspace_events(workspace)
    if workspace.public_changed?
      workspace.public? ?
          Events::WorkspaceMakePublic.by(current_user).add(:workspace => workspace) :
          Events::WorkspaceMakePrivate.by(current_user).add(:workspace => workspace)
    end

    if workspace.archived_changed?
      workspace.archived? ?
          Events::WorkspaceArchived.by(current_user).add(:workspace => workspace) :
          Events::WorkspaceUnarchived.by(current_user).add(:workspace => workspace)
    end

    if workspace.show_sandbox_datasets_changed?
      workspace.show_sandbox_datasets? ?
          Events::WorkspaceToShowSandboxDatasets.by(current_user).add(:workspace => workspace) :
          Events::WorkspaceToNoLongerShowSandboxDatasets.by(current_user).add(:workspace => workspace)
    end

    if workspace.project_status_changed? || workspace.project_status_reason_changed?
      Events::ProjectStatusChanged.by(current_user).add(:workspace => workspace)
    end
  end
end

