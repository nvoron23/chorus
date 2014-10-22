class DashboardsController < ApplicationController

  def show
    dashboard = Dashboard.build(
        :entity_type => params[:entity_type],
        :user => current_user,
        :additional => params
    ).fetch!

    present dashboard
  end
end
