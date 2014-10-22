class AttachmentPresenter < Presenter

  def to_hash
    {
        :id => model.id,
        :name => model.contents.original_filename,
        :timestamp => model.created_at,
        :icon_url => model.contents_are_image? ? model.contents.url(:icon) : nil ,
        :content_url => model.contents_are_image? ? model.contents.url(:original) : nil ,
        :entity_type => model.entity_type_name,
        :type => File.extname(model.contents.original_filename).sub(/^\./, ''),
        model.note.type_name.underscore => present(model.note.primary_target, options)
    }
  end

  def complete_json?
    true
  end
end
