module Dashboard
  class RecentWorkfilesPresenter < BasePresenter
    private

    def data
      model.result.map do |event|
        {
            :last_opened => event.created_at,
            :workfile => present(event.workfile, { :workfile_as_latest_version => true, :list_view => true })
        }
      end
    end
  end
end
