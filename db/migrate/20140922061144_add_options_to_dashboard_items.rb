class AddOptionsToDashboardItems < ActiveRecord::Migration
  def change
    add_column :dashboard_items, :options, :string, :default => '', :null => false
  end
end
