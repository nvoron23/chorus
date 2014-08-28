module Dashboard
  class RecentWorkfiles < DataModule

    attr_reader :user

    def assign_params(params)
      @user = params[:user]
    end

    private

    def fetch_results
      OpenWorkfileEvent.where(:user_id => user.id).order('workfile_id, created_at desc').select('distinct on (workfile_id) *').includes(:workfile).reverse_order.first(5)
    end
  end
end
