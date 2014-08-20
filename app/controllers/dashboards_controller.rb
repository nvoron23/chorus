class DashboardsController < ApplicationController

  def show
    dashboard = Dashboard.build(
        :entity_type => params[:entity_type],
        :user => current_user
    ).fetch!

    present dashboard
  end
end
