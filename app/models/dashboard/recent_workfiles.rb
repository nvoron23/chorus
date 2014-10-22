module Dashboard
  class RecentWorkfiles < DataModule

    attr_reader :user

    def assign_params(params)
      @user = params[:user]
    end

    private

    def fetch_results
      limitValue = user.dashboard_items.where(:name => 'RecentWorkfiles').select('options').map(&:options).first
      if limitValue == ''
        limitValue = 5
      end

      OpenWorkfileEvent.
          select('max(created_at) as created_at, workfile_id').
          where(:user_id => user.id).
          group(:workfile_id).
          order('created_at DESC').
          includes(:workfile).
          limit(limitValue)
    end
  end
end
