module Dashboards
  class ProjectCardListController < ApplicationController
    wrap_parameters :project_card_list

    def create
      authorize! :update, current_user

      option_value = params[:project_card_list][:option_value]
      config = DashboardConfig.new(current_user)
      config.set_options('ProjectCardList', option_value)

      render :json => {}
    end

    def show
      config = DashboardConfig.new(current_user)
      option = config.get_options('ProjectCardList').map(&:options)[0]
      render :json => {:option => option}
    end
  end

end
