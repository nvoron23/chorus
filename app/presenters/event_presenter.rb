class EventPresenter < Presenter
  def to_hash
    return as_comment if @options[:as_comment]

    basic_hash.
      merge(targets_hash).
      merge(additional_data_hash).
      merge(note_action_type_hash).
      merge(attachment_hash).
      merge(notification_hash).
      merge(comments_hash).
      merge(insight_hash).
      symbolize_keys
  end

  def simple_hash
    basic_hash.merge(targets_hash).
        merge(additional_data_hash).
        merge(note_action_type_hash).
        merge(attachment_hash)
  end

  def complete_json?
    true
  end

  private

  def child_presenter_hash
    {}
  end

  def comments_hash
    {
      :comments => present(model.comments, extended_options)
    }
  end

  def as_comment
    {
        :body => model.respond_to?(:body) ? model.body : model.commit_message,
        :author => present(model.actor, extended_options),
        :timestamp => model.created_at
    }
  end

  def insight_hash
    {
        :is_insight =>  model.insight?,
        :promoted_by => model.insight? ? present(model.promoted_by, extended_options) : nil,
        :promotion_time => model.insight? ? model.promotion_time : nil,
        :is_published => model.published?
    }
  end

  def notification_hash
    return { :unread => !model.notification_for_current_user.try(:read) } if @options[:read_receipts]
    {}
  end

  def basic_hash
    {
      :id => model.id,
      :actor => present(model.actor, extended_options),
      :action => action,
      :timestamp => model.created_at
    }.merge(child_presenter_hash)
  end

  def action
    return "NOTE" if model.is_a?(Events::Note)

    model.action
  end

  def note_action_type_hash
    return { :action_type => model.action } if model.is_a?(Events::Note)
    {}
  end

  def additional_data_hash
    pairs = model.additional_data.map do |key, value|
      if key == 'error_objects'
        value = ErrorPresenter.new(value).as_json
      else
        value = value.is_a?(String) ? sanitize(value) : value
      end
      [key, value]
    end
    Hash[pairs]
  end

  def targets_hash
    model.targets.reduce({}) do |hash, entry|
      name, model = entry
      hash[name] = present(model, extended_options.merge(:workfile_as_latest_version => true))
      hash
    end
  end

  def attachment_hash
    attachments = []
    if model.is_a?(Events::Note)
      file_attachments = model.attachments
      file_attachments.each_with_index do |model, index|
        attachments[index] = present(model, extended_options)
      end

      datasets = model.datasets
      datasets.each do |dataset|
        model_hash = present(dataset, {:workspace => model.workspace}.merge(extended_options))
        model_hash.merge!({:workspace => model.workspace}) if model.workspace
        model_hash.merge!({:entity_type => 'dataset'} )
        attachments << model_hash
      end

      workfiles = model.workfiles
      workfiles.each do |workfile|
        model_hash = present(workfile, extended_options.merge(:workfile_as_latest_version => true))
        model_hash.merge!({:entity_type => 'workfile'} )
        attachments << model_hash
      end
    end

    if model.is_a?(Events::NoteOnWorkfile) || model.is_a?(Events::WorkfileResult)
      model.notes_work_flow_results.each do |workflow_result|
        model_hash = {
            :entity_type => 'work_flow_result',
            :id => workflow_result.result_id,
        }

        model_hash.merge!(:workfile_id => model.workfile.id) if model.respond_to?(:workfile)
        attachments << model_hash
      end
    end

    {:attachments => attachments}
  end

  def extended_options
    @options.merge(:succinct => true, :activity_stream => true)
  end
end
