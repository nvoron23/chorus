class WorkspacePresenter < Presenter

  def to_hash
    results = {
      :id => model.id,
      :name => model.name,
      :is_deleted => model.deleted?,
      :entity_type => model.entity_type_name,
      :summary => sanitize(model.summary),
      :archived_at => model.archived_at,
      :permission => model.permissions_for(current_user),
      :public => model.public,
      :datasets_count => model.dataset_count(current_user),
      :members_count => model.members.count,
      :workfiles_count => model.workfiles.count,
      :insights_count => model.owned_notes.where(:insight => true).count,
      :recent_insights_count => model.owned_notes.where(:insight => true).recent.count,
      :recent_comments_count => model.owned_notes.recent.count,
      :has_recent_comments => model.owned_notes.recent.count > 0,
      :has_milestones => model.milestones_count > 0
    }

    unless succinct?
      results.merge!(
        :archiver => present(model.archiver),
        :image => present(model.image),
        :has_added_member => model.has_added_member,
        :has_added_workfile => model.has_added_workfile,
        :has_added_sandbox => model.has_added_sandbox,
        :has_changed_settings => model.has_changed_settings,
        :tags => present(model.tags, @options),
        :sandbox_info => present(model.sandbox, options.merge(:succinct => true)),
        :show_sandbox_datasets => model.show_sandbox_datasets
      )
    end

    unless rendering_activities?
      results.merge!(
          :owner => present(model.owner, options),
          :is_member => model.member?(current_user),
          :is_project => model.is_project,
          :project_status => model.project_status,
          :project_status_reason => model.project_status_reason,
          :milestone_count => model.milestones_count,
          :milestone_completed_count => model.milestones_achieved_count,
          :project_target_date => model.project_target_date.try(:strftime, "%Y-%m-%dT%H:%M:%SZ")
      )
      results.merge!(status_change_activity_hash) if latest_status_change_activity
      results.merge!(latest_comments_hash)
    end

    results
  end

  def complete_json?
    !succinct? && !rendering_activities?
  end

  private

  def latest_comments_hash
    return {} unless @options[:show_latest_comments]
    recent_notes = model.owned_notes.recent
    recent_comments = model.comments.recent

    recent_insights = recent_notes.where(:insight => true)

    recent_notes_and_comments = recent_notes.order("updated_at desc").limit(5) + recent_comments.order("updated_at desc").limit(5)

    latest_5 = recent_notes_and_comments.sort_by(&:updated_at).last(5)

    {
      :number_of_insights => recent_insights.size,
      :number_of_comments => recent_notes.size + recent_comments.size - recent_insights.size,
      :latest_comment_list => present(latest_5),
      :latest_insight => present(model.owned_notes.order("updated_at desc").where(:insight => true).first)
    }
  end

  def status_change_activity_hash
    activity = latest_status_change_activity
    activity.workspace = nil
    {
        :latest_status_change_activity => present(activity).merge({workspace: {id: model.id, name: model.name}})
    }
  end

  def latest_status_change_activity
    @activity ||= Events::ProjectStatusChanged.where(workspace_id: model.id).last
  end
end
