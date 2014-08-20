module Dashboard
  class RecentWorkfiles < DataModule

    attr_reader :user

    def assign_params(params)
      @user = params[:user]
    end

    private

    def fetch_results
      OpenWorkfileEvent.where(:user_id => user.id).includes(:workfile).last(5)
    end
  end
end
