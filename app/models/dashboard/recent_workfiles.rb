module Dashboard
  class RecentWorkfiles < DataModule

    attr_reader :user

    def assign_params(params)
      @user = params[:user]
    end

    private

    def fetch_results
      OpenWorkfileEvent.
          select('max(created_at) as created_at, workfile_id').
          where(:user_id => user.id).
          group(:workfile_id).
          order('created_at DESC').
          includes(:workfile).
          limit(5)
    end
  end
end
