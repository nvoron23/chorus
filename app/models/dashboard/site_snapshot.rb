module Dashboard
  class SiteSnapshot < DataModule
    INCREMENT_TIME = 7.days.ago

    private

    def fetch!
      @result = [Workspace, AssociatedDataset, Workfile, User].map do |model|
        {
            :model => model.to_s.underscore,
            :total => model.count,
            :increment => changed_count(model)
        }
      end
    end

    def changed_count(model)
      count_created = model.where('"created_at" > ?', INCREMENT_TIME).count
      count_deleted = model.unscoped.where('"created_at" < ? AND "deleted_at" > ?', INCREMENT_TIME, INCREMENT_TIME).count
      count_created - count_deleted
    end
  end
end
