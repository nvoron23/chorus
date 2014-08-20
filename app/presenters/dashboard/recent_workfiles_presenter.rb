module Dashboard
  class RecentWorkfilesPresenter < BasePresenter
    private

    def data
      present(model.result.map(&:workfile), :list_view => true)
    end
  end
end
